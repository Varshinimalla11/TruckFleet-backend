import Trip from "../models/trip.js";
import RestLog from "../models/restLog.js";
import DriveSession from "../models/driveSession.js";
import notifyUser from "../utils/notifyUser.js";

export const endRestAndStartDrive = async (req, res) => {
  try {
    const restLog = await RestLog.findById(req.params.rest_id);
    if (!restLog)
      return res.status(404).json({ message: "Rest log not found" });

    restLog.rest_end_time = new Date();
    if (req.body.fuel_at_rest_end !== undefined) {
      // Validate fuel_at_rest_end does not exceed fuel_at_rest_start
      const maxAllowedFuel = restLog.fuel_at_rest_start;
      if (req.body.fuel_at_rest_end > maxAllowedFuel) {
        return res.status(400).json({
          message: `Invalid fuel_at_rest_end: cannot be greater than fuel at rest start (${maxAllowedFuel})`,
        });
      }
      restLog.fuel_at_rest_end = req.body.fuel_at_rest_end;
    }
    await restLog.save();
    // Start a new drive session automatically
    const newDriveSession = await DriveSession.create({
      trip_id: restLog.trip_id,
      start_time: new Date(),
    });

    await notifyUser(req.user._id, "🟢 Rest ended. Drive session resumed.");
    const trip = await Trip.findById(restLog.trip_id).populate("driver_id");
    if (trip) {
      await notifyUser(
        trip.owner_id,
        `📢 Driver ${trip.driver_snapshot.name} has resumed driving after a rest.`
      );
    }
    res.json({
      message: "Rest ended and drive resumed",
      restLog,
      newDriveSession,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRestLogsByTrip = async (req, res) => {
  try {
    const restLogs = await RestLog.find({ trip_id: req.params.tripId });
    res.json(restLogs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
