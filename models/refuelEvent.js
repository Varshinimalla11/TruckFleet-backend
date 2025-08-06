const mongoose = require("mongoose");
const Joi = require("joi");

const RefuelEventSchema = new mongoose.Schema({
  trip_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trip",
    required: true,
  },
  event_time: {
    type: Date,
    required: true,
  },
  fuel_before: {
    type: Number,
    required: true,
  },
  fuel_added: {
    type: Number,
    required: true,
  },
  fuel_after: {
    type: Number,
    required: true,
  },
  payment_mode: {
    type: String, // optional: cash, card, UPI
    enum: ["cash", "card", "upi", "other"],
  },
});

const RefuelEvent = mongoose.model("RefuelEvent", RefuelEventSchema);
module.exports = RefuelEvent;
