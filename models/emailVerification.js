const mongoose = require("mongoose");

const EmailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL: auto-delete after expiry
  },
});

const EmailVerification = mongoose.model(
  "EmailVerification",
  EmailVerificationSchema
);

exports.EmailVerification = EmailVerification;
