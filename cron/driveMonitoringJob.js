import cron from "node-cron";
import DriveSession from "../models/driveSession.js";
import Trip from "../models/trip.js";
import notifyUser from "../utils/notifyUser.js";

function getHoursBetween(start, end) {
  return (new Date(end) - new Date(start)) / (1000 * 60 * 60);
}
function getMinutesBetween(start, end) {
  return (new Date(end) - new Date(start)) / (1000 * 60);
}

cron.schedule("*/1 * * * *", async () => {
  // runs every minute

  const ongoing = await DriveSession.find({ end_time: null });

  for (const session of ongoing) {
    const now = new Date();
    const trip = await Trip.findById(session.trip_id);
    if (!trip) continue;

    const driverId = trip.driver_id;
    const ownerId = trip.owner_id;
    const driverName =
      trip.driver_snapshot?.name || driverId?.toString() || "Unknown Driver";
    // --- 1. CONTINUOUS DRIVING VIOLATION ---
    const sessionMinutes = getMinutesBetween(session.start_time, now);
    if (sessionMinutes >= 3 && !session.warned_at_3min) {
      const msgDriver = `🚨 You have driven continuously over 3 minutes without rest!`;
      const msgOwner = `🚨 Driver ${driverName} has driven continuously over 3 minutes without rest!`;
      await notifyUser(driverId, msgDriver);
      await notifyUser(ownerId, msgOwner);
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
      const msgDriver = `🚨 You have exceeded driving time by 5 minutes today!`;
      const msgOwner = `🚨 Driver ${driverName} has exceeded driving time by 5 minutes today!`;
      await notifyUser(driverId, msgDriver);
      await notifyUser(ownerId, msgOwner);

      // Mark the warning on this ongoing session
      session.warned_at_5min = now;
      await session.save();
    }

    // --- 3. CONTINUOUS 3-HOUR CHECK (as existing) ---
    const sessionHours = getHoursBetween(session.start_time, now);
    if (sessionHours >= 3 && !session.warned_at_3hr) {
      const msgDriver =
        "⚠️ You have driven continuously over 3 hours. Take a rest!";
      const msgOwner = `⚠️ Driver ${driverName} has driven continuously over 3 hours. Take a rest!`;
      await notifyUser(driverId, msgDriver);
      await notifyUser(ownerId, msgOwner);
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
      const msgDriver = `🚨 You (Driver ${driverName}) have exceeded daily driving limit of 8 hours!`;
      const msgOwner = `🚨 Driver ${driverName} has exceeded daily driving limit of 8 hours!`;
      await notifyUser(driverId, msgDriver);
      await notifyUser(ownerId, msgOwner);
      session.warned_at_8hr = now;
      await session.save();
    }
  }
});
