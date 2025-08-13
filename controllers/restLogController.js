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

    res.json({
      message: "Rest ended and drive resumed",
      restLog,
      newDriveSession,
    });

    await notifyUser(req.user._id, "🟢 Rest ended. Drive session resumed.");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
