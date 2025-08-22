import Trip from "../models/trip.js";
import {validateTrip} from "../validationModels/validateTrip.js";
import notifyUser from "../utils/notifyUser.js";

import DriveSession from "../models/driveSession.js";
import RestLog from "../models/restLog.js";

// POST /api/trips
export const createTrip = async (req, res) => {
  const { error } = validateTrip(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (req.user.role === "driver")
    return res.status(403).send("Drivers cannot create trips.");

  const trip = new Trip({
    truck_id: req.body.truck_id,
    driver_id: req.body.driver_id,
    driver_snapshot: req.body.driver_snapshot,
    start_city: req.body.start_city,
    end_city: req.body.end_city,
    total_km: req.body.total_km,
    cargo_weight: req.body.cargo_weight,
    fuel_start: req.body.fuel_start,
    start_time: req.body.start_time,
    owner_id: req.user._id,
    // end_time: null,
  });

  await trip.save();
  // 🔔 Notify driver
  await notifyUser(
    trip.driver_id,
    `🆕 New trip assigned: ${trip.start_city} → ${trip.end_city}`
  );

  // 🔔 Notify owner
  await notifyUser(
    trip.owner_id,
    "🚛 Trip created successfully. Driver assigned."
  );
  res.status(201).send(trip);
};

// GET /api/trips
export const getAllTrips = async (req, res) => {
  if (req.user.role === "driver") {
    return res.status(403).send("Drivers are not allowed to view all trips.");
  }

  const showDeleted = req.query.showDeleted === "true";

  const filter = {
    ...(req.user.role === "owner" && { owner_id: req.user._id }),
  };

  if (showDeleted) {
    filter.isDeleted = true;
  } else {
    filter.isDeleted = false;
  }

  const trips = await Trip.find(filter)
    .populate("truck_id")
    .populate("driver_id");
  res.send(trips);
};

// GET /api/trips/:id
export const getTripById = async (req, res) => {
  const trip = await Trip.findOne({
    _id: req.params.id,
    isDeleted: false, // ✅ Only fetch non-deleted trips
  })
    .populate("truck_id")
    .populate("driver_id");
  if (!trip) return res.status(404).send("Trip not found");
  const allSessions = await DriveSession.find({ trip_id: trip._id });
  const totalKmCovered = allSessions.reduce(
    (sum, s) => sum + Math.max(s.km_covered || 0, 0),
    0
  );
  const remaining_km_in_trip = Math.max(trip.total_km - totalKmCovered, 0);

  res.send({
    ...trip.toObject(),
    remaining_km_in_trip,
  });
};

// PUT /api/trips/:id/start
export const startTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).send("Trip not found");

  if (trip.status !== "scheduled") {
    return res
      .status(400)
      .send("Trip can only be started if it is in 'scheduled' status.");
  }
  const now = new Date();
  trip.status = "ongoing";
  trip.start_time = now;
  await trip.save();

  const firstSession = new DriveSession({
    trip_id: trip._id,
    start_time: now,
  });
  await firstSession.save();

  await notifyUser(
    trip.driver_id,
    "🚚 Your trip has started. Drive session created"
  );
  await notifyUser(
    trip.owner_id,
    `📢 Driver ${trip.driver_snapshot.name} has started the trip from ${trip.start_city}.`
  );

  res.send({ message: "Trip started", trip, firstSession });
};

export const completeTrip = async (req, res) => {
  try {
    const { fuel_left } = req.body;
    if (fuel_left === undefined || fuel_left === null) {
      return res
        .status(400)
        .json({ message: "fuel_left is required to complete the trip" });
    }

    const trip = await Trip.findById(req.params.id); // ✅ fixed param
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    if (trip.status === "completed") {
      return res.status(400).json({ message: "Trip is already completed" });
    }

    const now = new Date();

    // Close any open DriveSession
    const openDrive = await DriveSession.findOne({
      trip_id: trip._id,
      end_time: null, // ✅ changed for consistency
    });
    if (openDrive) {
      openDrive.end_time = now;
      openDrive.fuel_end = fuel_left;
      await openDrive.save();
    }

    // Close any open RestLog
    const openRest = await RestLog.findOne({
      trip_id: trip._id,
      rest_end_time: null, // ✅ changed for consistency
    });
    if (openRest) {
      openRest.rest_end_time = now;
      openRest.fuel_at_rest_end = fuel_left;
      await openRest.save();
    }

    // Update trip details
    trip.status = "completed";
    trip.trip_end_time = now;
    trip.fuel_end = fuel_left;
    await trip.save();

    // 🔔 Notify driver
    await notifyUser(trip.driver_id, "✅ You completed the trip successfully.");

    // 🔔 Notify owner
    await notifyUser(
      trip.owner_id,
      `📢 Driver ${trip.driver_snapshot.name} has completed the trip ${trip.start_city} → ${trip.end_city}.`
    );

    res.json({
      message: "Trip completed successfully",
      trip,
      closedDriveSession: openDrive || null,
      closedRestLog: openRest || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/trips/:id
export const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).send("Trip not found");

    if (["completed", "cancelled"].includes(trip.status)) {
      return res
        .status(400)
        .send("Cannot update a completed or cancelled trip.");
    }

    // Only owners or admins can update trips
    if (req.user.role === "driver") {
      return res.status(403).send("Drivers cannot update trips.");
    }

    // Allowed fields to update
    const allowedUpdates = [
      "start_city",
      "end_city",
      "total_km",
      "cargo_weight",
      "fuel_start",
      "start_time",
      "status",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        trip[field] = req.body[field];
      }
    });

    await trip.save();

    res.status(200).json({ message: "Trip updated successfully", trip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/trips/:id
// Soft delete: mark trip as deleted instead of removing it
export const deleteTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).send("Trip not found");

  trip.isDeleted = true;
  await trip.save();

  res.send({ message: "Trip soft-deleted" });
};

// PUT /api/trips/:id/restore
export const restoreTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).send("Trip not found");

  if (!trip.isDeleted) return res.status(400).send("Trip is not deleted.");

  trip.isDeleted = false;
  await trip.save();

  res.send({ message: "Trip restored successfully", trip });
};

// PUT /api/trips/:id/cancel
export const cancelTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).send("Trip not found");

  if (trip.status === "completed") {
    return res.status(400).send("Completed trips cannot be cancelled.");
  }

  if (trip.status === "cancelled") {
    return res.status(400).send("Trip is already cancelled.");
  }

  trip.status = "cancelled";
  await trip.save();

  // 🔔 Notify driver
  await notifyUser(trip.driver_id, "⚠️ Your trip has been cancelled.");
  // 🔔 Notify owner
  await notifyUser(
    trip.owner_id,
    `⚠️ Trip from ${trip.start_city} → ${trip.end_city} was cancelled.`
  );

  res.send({ message: "Trip cancelled successfully", trip });
};

// GET /api/trips/my-trips - driver-specific trips
export const getMyTrips = async (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).send("Only drivers can view their trips.");
  }

  try {
    const trips = await Trip.find({
      driver_id: req.user._id,
      isDeleted: false,
    })
      .populate("truck_id")
      .populate("driver_id");

    res.send(trips);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};
