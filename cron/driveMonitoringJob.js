const cron = require("node-cron");
const DriveSession = require("../models/driveSession");
const Trip = require("../models/trip");
const notifyUser = require("../utils/notifyUser");

function getHoursBetween(start, end) {
  return (new Date(end) - new Date(start)) / (1000 * 60 * 60);
}
function getMinutesBetween(start, end) {
  return (new Date(end) - new Date(start)) / (1000 * 60);
}

cron.schedule("*/1 * * * *", async () => { // runs every minute
  
  const ongoing = await DriveSession.find({ end_time: null });

  for (const session of ongoing) {
    const now = new Date();
    const trip = await Trip.findById(session.trip_id);
    if (!trip) continue;

    const driverId = trip.driver_id;
    const ownerId = trip.owner_id;

    // --- 1. CONTINUOUS DRIVING VIOLATION ---
    const sessionMinutes = getMinutesBetween(session.start_time, now);
    if (sessionMinutes >= 3 && !session.warned_at_3min) {
      const msg = "🚨 Continuous driving over 3 minutes without rest!";
      await notifyUser(driverId, msg);
      await notifyUser(ownerId, msg);
      session.warned_at_3min = now;
      await session.save();
    }

    // --- 2. TOTAL DRIVING TIME TODAY VIOLATION ---
    // Calculate total minutes driven today for the trip (all sessions)
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const todaySessions = await DriveSession.find({
      trip_id: session.trip_id,
      start_time: { $gte: dayStart, $lte: dayEnd },
    });

    let totalMinutes = 0;
    let warnedAlready = false;
    for (const s of todaySessions) {
      const end = s.end_time || now;
      totalMinutes += getMinutesBetween(s.start_time, end);
      if (s.warned_at_5min) warnedAlready = true;
    }
    // Only trigger this warning ONCE, regardless of how many sessions today
    if (totalMinutes >= 5 && !warnedAlready) {
      const msg = "🚨 Driving exceeded 5 minutes total today!";
      await notifyUser(driverId, msg);
      await notifyUser(ownerId, msg);

      // Mark the warning on this ongoing session
      session.warned_at_5min = now;
      await session.save();
    }

    // --- 3. CONTINUOUS 3-HOUR CHECK (as existing) ---
    const sessionHours = getHoursBetween(session.start_time, now);
    if (sessionHours >= 3 && !session.warned_at_3hr) {
      const msg = "⚠️ Continuous driving over 3 hours. Take a rest!";
      await notifyUser(driverId, msg);
      await notifyUser(ownerId, msg);
      session.warned_at_3hr = now;
      await session.save();
    }

    // --- 4. DAILY TOTAL 8-HOUR CHECK (as existing) ---
    let totalHoursToday = 0;
    let hour8Warned = false;
    for (const s of todaySessions) {
      const end = s.end_time || now;
      totalHoursToday += getHoursBetween(s.start_time, end);
      if (s.warned_at_8hr) hour8Warned = true;
    }
    if (totalHoursToday >= 8 && !hour8Warned) {
      const msg = "🚨 Daily driving exceeded 8 hours!";
      await notifyUser(driverId, msg);
      await notifyUser(ownerId, msg);
      session.warned_at_8hr = now;
      await session.save();
    }
  }
  
});


















// const cron = require("node-cron");

// const DriveSession = require("../models/driveSession");
// const Trip = require("../models/trip");
// const notifyUser = require("../utils/notifyUser");

// function getHoursBetween(start, end) {
//   return (new Date(end) - new Date(start)) / (1000 * 60 * 60);
// }

// cron.schedule("*/1 * * * *", async () => { // runs every minute for finer granularity
//   console.log("⏰ Cron: Checking drive violations...");
//   const ongoing = await DriveSession.find({ end_time: null });

//   for (const session of ongoing) {
//     const now = new Date();
//     const trip = await Trip.findById(session.trip_id);
//     if (!trip) continue;

//     const driverId = trip.driver_id;
//     const ownerId = trip.owner_id;

//     const sessionHours = getHoursBetween(session.start_time, now);

//     // 3 minutes = 0.05 hours, 5 minutes = ~0.0833 hours
//     if (sessionHours >= 0.05 && !session.warned_at_3min) {
//       const msg = "🚨 Continuous driving over 3 minutes without rest!";
//       await notifyUser(driverId, msg);
//       await notifyUser(ownerId, msg);
//       session.warned_at_3min = now;
//       await session.save();
//     }

//     if (sessionHours >= 0.0833 && !session.warned_at_5min) {
//       const msg = "🚨 Driving exceeded 5 minutes today!";
//       await notifyUser(driverId, msg);
//       await notifyUser(ownerId, msg);
//       session.warned_at_5min = now;
//       await session.save();
//     }

//     // Existing 3-hour continuous driving
//     if (sessionHours >= 3 && !session.warned_at_3hr) {
//       const msg = "⚠️ Continuous driving over 3 hours. Take a rest!";
//       await notifyUser(driverId, msg);
//       await notifyUser(ownerId, msg);
//       session.warned_at_3hr = now;
//       await session.save();
//     }

//     // Existing 8-hour daily total driving
//     const dayStart = new Date(now);
//     dayStart.setHours(0, 0, 0, 0);
//     const dayEnd = new Date(now);
//     dayEnd.setHours(23, 59, 59, 999);
//     const todaySessions = await DriveSession.find({
//       trip_id: session.trip_id,
//       start_time: { $gte: dayStart, $lte: dayEnd },
//     });

//     let totalToday = 0;
//     for (const s of todaySessions) {
//       const end = s.end_time || now;
//       totalToday += getHoursBetween(s.start_time, end);
//     }

//     if (totalToday >= 8 && !session.warned_at_8hr) {
//       const msg = "🚨 Daily driving exceeded 8 hours!";
//       await notifyUser(driverId, msg);
//       await notifyUser(ownerId, msg);
//       session.warned_at_8hr = now;
//       await session.save();
//     }
//   }
//   console.log("✅ Cron check done.");
// });













// const cron = require("node-cron");
// const DriveSession = require("../models/driveSession");
// const Trip = require("../models/trip");
// const notifyUser = require("../utils/notifyUser");
// const Notification = require("../models/notification");

// function getHoursBetween(start, end) {
//   return (new Date(end) - new Date(start)) / (1000 * 60 * 60);
// }

// cron.schedule("*/15 * * * *", async () => {
//   console.log("⏰ Cron: Checking drive violations...");

//   const ongoing = await DriveSession.find({ end_time: null });

//   for (const session of ongoing) {
//     const now = new Date();
//     const trip = await Trip.findById(session.trip_id);
//     if (!trip) continue;

//     const driverId = trip.driver_id;
//     const ownerId = trip.owner_id;

//     const sessionHours = getHoursBetween(session.start_time, now);

//     // 🚨 3-hour continuous drive violation
//     if (sessionHours >= 3 && !session.warned_at_3hr) {
//       const msg = "⚠️ Continuous driving over 3 hours. Take a rest!";
//       await notifyUser(driverId, msg);
//       await notifyUser(ownerId, msg);

//       session.warned_at_3hr = now;
//       await session.save();
//     }

//     // 🚨 8-hour daily total driving violation
//     const dayStart = new Date(now);
//     dayStart.setHours(0, 0, 0, 0);
//     const dayEnd = new Date(now);
//     dayEnd.setHours(23, 59, 59, 999);

//     const todaySessions = await DriveSession.find({
//       trip_id: session.trip_id,
//       start_time: { $gte: dayStart, $lte: dayEnd },
//     });

//     let totalToday = 0;
//     for (const s of todaySessions) {
//       const end = s.end_time || now;
//       totalToday += getHoursBetween(s.start_time, end);
//     }

//     if (totalToday >= 8 && !session.warned_at_8hr) {
//       const msg = "🚨 Daily driving exceeded 8 hours!";
//       await notifyUser(driverId, msg);
//       await notifyUser(ownerId, msg);

//       session.warned_at_8hr = now;
//       await session.save();
//     }
//   }

//   console.log("✅ Cron check done.");
// });
