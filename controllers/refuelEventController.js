const RefuelEvent = require("../models/refuelEvent");
const Trip = require("../models/trip");
const validateRefuelEvent = require("../validationModels/validateRefuel");

exports.logRefuel = async (req, res) => {
  const { error } = validateRefuelEvent(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const {
    trip_id,
    event_time,
    fuel_before,
    fuel_added,
    fuel_after,
    payment_mode,
  } = req.body;

  const trip = await Trip.findById(trip_id);
  if (!trip) return res.status(404).send("Trip not found");

  // Only trip driver or owner can add refuel log
  if (
    req.user.role === "driver" &&
    trip.driver_id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).send("Access denied");
  }

  const refuelEvent = new RefuelEvent({
    trip_id,
    event_time,
    fuel_before,
    fuel_added,
    fuel_after,
    payment_mode,
  });

  await refuelEvent.save();
  res.status(201).send({ message: "Refuel event logged", refuelEvent });
};

exports.getRefuelLogsByTrip = async (req, res) => {
  const { tripId } = req.params;

  const trip = await Trip.findById(tripId);
  if (!trip) return res.status(404).send("Trip not found");

  if (
    req.user.role === "driver" &&
    trip.driver_id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).send("Access denied");
  }

  const logs = await RefuelEvent.find({ trip_id: tripId });
  res.send(logs);
};
