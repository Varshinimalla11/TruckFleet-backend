const validateRestLog = require("../validationModels/validateRestLog");
const Trip = require("../models/trip");
const RestLog = require("../models/restLog");
const DriveSession = require("../models/driveSession");
const notifyUser = require("../utils/notifyUser");

exports.endRestAndStartDrive = async (req, res) => {
  const { rest_id } = req.params;
  const { fuel_filled } = req.body;

  const rest = await RestLog.findById(rest_id);
  if (!rest) return res.status(404).send("Rest log not found");

  rest.rest_end_time = new Date();

  rest.fuel_filled = fuel_filled;
  await rest.save();

  const drive = new DriveSession({
    trip_id: rest.trip_id,
    start_time: rest.rest_end_time,
  });
  await drive.save();

  await notifyUser(req.user._id, "🟢 Rest ended. Drive session resumed.");

  res.send({
    message: "Rest ended and drive resumed",
    restLog: rest,
    newDriveSession: drive,
  });
};
