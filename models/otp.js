const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index for automatic deletion
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

OTPSchema.index({ email: 1, otp: 1 });

const OTP = mongoose.model("OTP", OTPSchema);

exports.OTP = OTP;
