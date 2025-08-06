// const mongoose = require("mongoose");
// const validator = require("validator");

// const driverSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     minlength: 3,
//     maxlength: 50,
//     trim: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true,
//     validate: {
//       validator: validator.isEmail,
//       message: "Invalid email format",
//     },
//   },
//   password: {
//     type: String,
//     required: true,
//     minlength: 6,
//     maxlength: 1024,
//   },
//   ownerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Owner",
//     required: true,
//   },
// });

// const Driver = mongoose.model("Driver", driverSchema);

// exports.Driver = Driver;
// exports.driverSchema = driverSchema;
