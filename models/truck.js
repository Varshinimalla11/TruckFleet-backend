const mongoose = require("mongoose");
const { ownerSchema } = require("./owner");

const truckSchema = new mongoose.Schema({
  plate_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  condition: {
    type: String,
    required: true,
    enum: ["active", "maintenance_needed", "in_maintenance", "inactive"],
    default: "active",
  },
  mileage_factor: {
    type: Number,
    required: true,
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});
truckSchema.index({ owner_id: 1 });

const Truck = mongoose.model("Truck", truckSchema);

exports.Truck = Truck;
exports.truckSchema = truckSchema;
