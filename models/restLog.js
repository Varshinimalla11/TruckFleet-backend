const mongoose = require("mongoose");

const RestLogSchema = new mongoose.Schema({
  trip_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trip",
    required: true,
  },
  rest_start_time: {
    type: Date,
    required: true,
  },
  rest_end_time: {
    type: Date,
  },
  fuel_at_rest_start: {
    type: Number,
  },
  fuel_at_rest_end: {
    type: Number,
  },
});

const RestLog = mongoose.model("RestLog", RestLogSchema);
module.exports = RestLog;
