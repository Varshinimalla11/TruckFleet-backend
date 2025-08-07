const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    truck_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Truck",
      required: true,
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver_snapshot: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      aadhar_number: {
        type: String,
        required: true,
        match: /^\d{12}$/, // 12-digit Aadhaar
      },
      license_number: {
        type: String,
        required: true,
        trim: true,
      },
    },
    start_city: {
      type: String,
      required: true,
      trim: true,
    },
    end_city: {
      type: String,
      required: true,
      trim: true,
    },
    total_km: {
      type: Number,
      required: true,
    },
    cargo_weight: {
      type: Number,
      required: true,
    },
    fuel_start: {
      type: Number,
      required: true,
    },
    start_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;
