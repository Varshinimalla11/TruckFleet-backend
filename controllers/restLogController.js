const validateRestLog = require("../validationModels/validateRestLog");
const Trip = require("../models/trip");
const RestLog = require("../models/restLog");
const DriveSession = require("../models/driveSession");
const notifyUser = require("../utils/notifyUser");

exports.endRestAndStartDrive = async (req, res) => {
  try {
    const restLog = await RestLog.findById(req.params.rest_id);
    console.log(restLog);
    if (!restLog)
      return res.status(404).json({ message: "Rest log not found" });

    restLog.rest_end_time = new Date();
    if (req.body.fuel_at_rest_end !== undefined) {
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


// ✅ Get all rest logs for a trip
exports.getRestLogsByTrip = async (req, res) => {
  try {
    const restLogs = await RestLog.find({ trip_id: req.params.tripId });
    res.json(restLogs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};