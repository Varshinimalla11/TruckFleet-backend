const Trip = require("../models/trip");
const { validateTrip } = require("../validationModels/validateTrip");
const notifyUser = require("../utils/notifyUser");
const User = require("../models/user");

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
  const statusFilter = req.query.status; // ?status=ongoing
  const filter = {
    isDeleted: false,
    ...(req.user.role === "owner" && { owner_id: req.user._id }),
    ...(statusFilter && { status: statusFilter }),
  };

  const trips = await Trip.find(filter);
  res.send(trips);
};

// GET /api/trips/:id
exports.getTripById = async (req, res) => {
  const trip = await Trip.findOne({
    _id: req.params.id,
    isDeleted: false, // ✅ Only fetch non-deleted trips
  });
  if (!trip) return res.status(404).send("Trip not found");
  res.send(trip);
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

  trip.status = "ongoing";
  trip.start_time = new Date();
  await trip.save();
  await notifyUser(trip.driver_id, "🚚 Your trip has started.");
  await notifyUser(
    trip.owner_id,
    `📢 Your driver has started the trip from ${trip.start_city}.`
  );

  res.send({ message: "Trip started", trip });
};

// PUT /api/trips/:id/complete
exports.completeTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).send("Trip not found");

  if (trip.status !== "ongoing") {
    return res
      .status(400)
      .send("Trip can only be completed if it is 'ongoing'.");
  }

  trip.status = "completed";
  trip.end_time = new Date();
  await trip.save();

  res.send({ message: "Trip completed", trip });
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
