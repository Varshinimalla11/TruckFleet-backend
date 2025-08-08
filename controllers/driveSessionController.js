const DriveSession = require("../models/driveSession");
const RestLog = require("../models/restLog");
const Trip = require("../models/trip");
const { Notification } = require("../models/notification");
const { Truck } = require("../models/truck");
// const { validateDriveSession } = require("../validations/driveSessionValidation"); // Uncomment if using Joi validation

// Utility
function getHoursBetween(start, end) {
  return (new Date(end) - new Date(start)) / (1000 * 60 * 60);
}

async function sendViolationNotification(userId, message) {
  await Notification.create({
    user_id: userId,
    message,
  });
}

//
// 1️⃣ Create drive session manually (if allowed)
//
exports.createDriveSession = async (req, res) => {
  const { trip_id, start_time, end_time, fuel_used, km_covered } = req.body;

  // ✅ Validation (optional)
  // const { error } = validateDriveSession(req.body);
  // if (error) return res.status(400).send(error.details[0].message);

  if (new Date(end_time) <= new Date(start_time)) {
    return res.status(400).send("End time must be after start time");
  }

  const trip = await Trip.findById(trip_id);
  if (!trip) return res.status(404).send("Trip not found");

  if (
    req.user.role === "driver" &&
    req.user._id.toString() !== trip.driver_id.toString()
  )
    return res.status(403).send("You are not authorized to log this session");

  const session = new DriveSession({
    trip_id,
    start_time,
    end_time,
    fuel_used,
    km_covered,
  });

  await session.save();

  // === Violation Checks ===
  const dayStart = new Date(start_time);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(start_time);
  dayEnd.setHours(23, 59, 59, 999);

  const sessionsToday = await DriveSession.find({
    trip_id,
    start_time: { $gte: dayStart, $lte: dayEnd },
  });

  let totalHours = 0;
  for (let s of sessionsToday) {
    totalHours += getHoursBetween(s.start_time, s.end_time);
  }

  if (totalHours > 8) {
    const msg = "🚨 Driving exceeded 8 hours today!";
    await sendViolationNotification(trip.driver_id, msg);
    await sendViolationNotification(trip.owner_id, msg);
  }

  const continuousDuration = getHoursBetween(start_time, end_time);
  if (continuousDuration > 4) {
    const lastRest = await RestLog.findOne({
      trip_id,
      rest_end_time: { $lte: new Date(start_time) },
    })
      .sort({ rest_end_time: -1 })
      .limit(1);

    const msg = "🚨 Continuous driving over 4 hours without rest!";
    if (!lastRest || getHoursBetween(lastRest.rest_end_time, start_time) > 0) {
      await sendViolationNotification(trip.driver_id, msg);
      await sendViolationNotification(trip.owner_id, msg);
    }
  }

  res.status(201).send({ message: "Drive session logged", session });
};

//
// 2️⃣ End drive session and start rest
//
exports.endDriveSessionAndStartRest = async (req, res) => {
  const { session_id } = req.params;
  const { fuel_left } = req.body;

  const session = await DriveSession.findById(session_id);
  if (!session) return res.status(404).send("Drive session not found");
  if (session.end_time) return res.status(400).send("Session already ended");

  const now = new Date();
  session.end_time = now;

  const duration = getHoursBetween(session.start_time, now);
  session.duration_hours = Number(duration.toFixed(2));

  const trip = await Trip.findById(session.trip_id);
  const truck = await Truck.findById(trip.truck_id);
  const mileage = truck.mileage_factor || 3;
  let km_covered = fuel_used * mileage;
  if (km_covered < 0) km_covered = 0;
  const lastRest = await RestLog.findOne({
    trip_id: trip._id,
    rest_end_time: { $exists: true },
  }).sort({ rest_end_time: -1 });

  const start_fuel = lastRest?.fuel_filled ?? trip.initial_fuel_start ?? 100;
  let fuel_used = start_fuel - fuel_left;
  if (fuel_used < 0) fuel_used = 0;

  session.fuel_used = Number(fuel_used.toFixed(2));
  session.km_covered = Number((fuel_used * mileage).toFixed(2));
  await session.save();

  const rest = new RestLog({
    trip_id: session.trip_id,
    rest_start_time: now,
    fuel_at_rest_start: fuel_left,
  });

  await rest.save();

  const allSessions = await DriveSession.find({ trip_id: trip._id });
  const totalKmCovered = allSessions.reduce(
    (sum, s) => sum + (s.km_covered || 0),
    0
  );
  const remaining_km_in_trip = Math.max(trip.total_km - totalKmCovered, 0);

  await Notification.create({
    user_id: req.user._id,
    message: `🛑 Drive session ended after ${session.duration_hours} hrs. Rest started.`,
  });

  res.send({
    message: "Drive session ended and rest started",
    fuel_used: session.fuel_used,
    km_covered: session.km_covered,
    remaining_km_in_trip,
    session,
    restLog: rest,
  });
};

//
// 3️⃣ Get drive sessions by trip
//
exports.getSessionsByTrip = async (req, res) => {
  const { tripId } = req.params;

  const trip = await Trip.findById(tripId);
  if (!trip) return res.status(404).send("Trip not found");

  if (
    req.user.role === "driver" &&
    trip.driver_id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).send("Access denied");
  }

  const sessions = await DriveSession.find({ trip_id: tripId });
  res.send(sessions);
};

// const Joi = require("joi");
// const DriveSession = require("../models/driveSession");
// const RestLog = require("../models/restLog");
// const Trip = require("../models/trip");
// const Truck = require("../models/truck");
// const validateDriveSession = require("../validationModels/validateDriveSession");
// const notifyUser = require("../utils/notifyUser");

// exports.endDriveSessionAndStartRest = async (req, res) => {
//   const { session_id } = req.params;

//   const session = await DriveSession.findById(session_id);
//   if (!session) return res.status(404).send("Drive session not found");

//   if (session.end_time)
//     return res.status(400).send("Drive session already ended");

//   const now = new Date();
//   session.end_time = now;

//   const duration = (now - session.start_time) / (1000 * 60 * 60);
//   session.duration_hours = Number(duration.toFixed(2));
//   await session.save();

//   const rest = new RestLog({
//     trip_id: session.trip_id,
//     rest_start_time: now,
//     fuel_at_rest_start: session.fuel_used ?? 0,
//   });
//   await rest.save();

//   await notifyUser(
//     req.user._id,
//     `🛑 Drive ended after ${session.duration_hours} hrs. Rest started.`
//   );

//   res.send({
//     message: "Drive session ended and rest started",
//     session,
//     restLog: rest,
//   });
// };
