const Trip = require("../models/trip");
const { validateTrip } = require("../validationModels/validateTrip");
const notifyUser = require("../utils/notifyUser");
const User = require("../models/user");
const DriveSession = require("../models/driveSession");
const RestLog = require("../models/restLog");

// POST /api/trips
exports.createTrip = async (req, res) => {
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
  res.status(201).send(trip);
};

// GET /api/trips
exports.getAllTrips = async (req, res) => {
  if (req.user.role === "driver") {
    return res.status(403).send("Drivers are not allowed to view all trips.");
  }
  const statusFilter = req.query.status; // ?status=ongoing
  const filter = {
    isDeleted: false,
    ...(req.user.role === "owner" && { owner_id: req.user._id }),
    ...(statusFilter && { status: statusFilter }),
  };

  const trips = await Trip.find(filter)
    .populate("truck_id")
    .populate("driver_id");
  res.send(trips);
};

// GET /api/trips/:id
exports.getTripById = async (req, res) => {
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
exports.startTrip = async (req, res) => {
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
    `📢 Your driver has started the trip from ${trip.start_city}.`
  );

  res.send({ message: "Trip started", trip, firstSession });
};

// // PUT /api/trips/:id/complete
// exports.completeTrip = async (req, res) => {
//   const trip = await Trip.findById(req.params.id);
//   if (!trip) return res.status(404).send("Trip not found");

//   if (trip.status !== "ongoing") {
//     return res
//       .status(400)
//       .send("Trip can only be completed if it is 'ongoing'.");
//   }

//   if (typeof req.body.fuel_end !== "number") {
//     return res
//       .status(400)
//       .send("Fuel at end is required and must be a number.");
//   }

//   const now = new Date();
//   trip.status = "completed";
//   trip.end_time = now;
//   trip.fuel_end = req.body.fuel_end;
//   await trip.save();

//   let driveSessionClosed = false;
//   let restLogClosed = false;

//   // 🛑 Auto-end any active drive session
//   const ongoingDrive = await DriveSession.findOne({
//     trip_id: trip._id,
//     end_time: null,
//   });

//   if (ongoingDrive) {
//     ongoingDrive.end_time = now;
//     ongoingDrive.duration_hours = Number(
//       ((now - ongoingDrive.start_time) / (1000 * 60 * 60)).toFixed(2)
//     );
//     await ongoingDrive.save();
//     driveSessionClosed = true;
//   }

//   if (!ongoingDrive) {
//     const ongoingRest = await RestLog.findOne({
//       trip_id: trip._id,
//       rest_end_time: null,
//     });
//     if (ongoingRest) {
//       ongoingRest.rest_end_time = now;
//       ongoingRest.duration_hours = Number(
//         ((now - ongoingRest.rest_start_time) / (1000 * 60 * 60)).toFixed(2)
//       );
//       await ongoingRest.save();
//       restLogClosed = true;
//     }
//   }

//   res.send({
//     message: "✅ Trip completed",
//     trip,
//     driveSessionClosed,
//     restLogClosed,
//   });
// };

exports.completeTrip = async (req, res) => {
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

    // Notify driver/owner
    await notifyUser(req.user._id, "✅ Trip completed successfully.");

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
exports.updateTrip = async (req, res) => {
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
exports.deleteTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).send("Trip not found");

  trip.isDeleted = true;
  await trip.save();

  res.send({ message: "Trip soft-deleted" });
};

// PUT /api/trips/:id/restore
exports.restoreTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).send("Trip not found");

  if (!trip.isDeleted) return res.status(400).send("Trip is not deleted.");

  trip.isDeleted = false;
  await trip.save();

  res.send({ message: "Trip restored successfully", trip });
};

// PUT /api/trips/:id/cancel
exports.cancelTrip = async (req, res) => {
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

  res.send({ message: "Trip cancelled successfully", trip });
};
