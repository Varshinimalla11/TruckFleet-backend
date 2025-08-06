const mongoose = require("mongoose");

const DriveSessionSchema = new mongoose.Schema({
  trip_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trip",
    required: true,
  },
  start_time: {
    type: Date,
    required: true,
  },
  end_time: {
    type: Date,
    required: true,
  },
  fuel_used: {
    type: Number,
  },
  km_covered: {
    type: Number,
  },
});

const DriveSession = mongoose.model("DriveSession", DriveSessionSchema);
module.exports = DriveSession;
