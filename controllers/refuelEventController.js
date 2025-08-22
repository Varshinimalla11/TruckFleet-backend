import RefuelEvent from "../models/refuelEvent.js";
import Trip from "../models/trip.js";
import refuelValidation from "../validationModels/validateRefuel.js";
import notifyUser from "../utils/notifyUser.js";


export const logRefuel = async (req, res) => {
  const { error } = refuelValidation.validateRefuelEvent(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { trip_id, event_time, fuel_before, fuel_added, payment_mode } =
    req.body;

  const fuel_after = fuel_before + fuel_added;

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

  // 🔔 Notify user (driver/owner who added)
  await notifyUser(req.user._id, "⛽ Refuel log added successfully.");

  // 🔔 Notify owner if not the same as current user
  if (trip.owner_id.toString() !== req.user._id.toString()) {
    await notifyUser(
      trip.owner_id,
      `📢 Driver ${trip.driver_snapshot.name} logged a refuel: +${fuel_added}L (${payment_mode})`
    );
  }

  res.status(201).send({ message: "Refuel event logged", refuelEvent });
};

export const getRefuelLogsByTrip = async (req, res) => {
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
