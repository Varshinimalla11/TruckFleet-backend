const cron = require("node-cron");
const DriveSession = require("../models/driveSession");
const Trip = require("../models/trip");
const notifyUser = require("../utils/notifyUser");

function getHoursBetween(start, end) {
  return (new Date(end) - new Date(start)) / (1000 * 60 * 60);
}

cron.schedule("*/15 * * * *", async () => {
  console.log("⏰ Cron: Checking drive violations...");

  const ongoing = await DriveSession.find({ end_time: null });

  for (const session of ongoing) {
    const now = new Date();
    const trip = await Trip.findById(session.trip_id);
    if (!trip) continue;

    const driverId = trip.driver_id;
    const ownerId = trip.owner_id;

    const sessionHours = getHoursBetween(session.start_time, now);

    // 🚨 3-hour continuous drive violation
    if (sessionHours >= 3 && !session.warned_at_3hr) {
      const msg = "⚠️ Continuous driving over 3 hours. Take a rest!";
      await notifyUser(driverId, msg);
      await notifyUser(ownerId, msg);

      session.warned_at_3hr = now;
      await session.save();
    }

    // 🚨 8-hour daily total driving violation
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const todaySessions = await DriveSession.find({
      trip_id: session.trip_id,
      start_time: { $gte: dayStart, $lte: dayEnd },
    });

    let totalToday = 0;
    for (const s of todaySessions) {
      const end = s.end_time || now;
      totalToday += getHoursBetween(s.start_time, end);
    }

    if (totalToday >= 8 && !session.warned_at_8hr) {
      const msg = "🚨 Daily driving exceeded 8 hours!";
      await notifyUser(driverId, msg);
      await notifyUser(ownerId, msg);

      session.warned_at_8hr = now;
      await session.save();
    }
  }

  console.log("✅ Cron check done.");
});
