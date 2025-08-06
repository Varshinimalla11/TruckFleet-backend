// const mongoose = require("mongoose");
// const validator = require("validator");

// const ownerSchema = new mongoose.Schema({
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
//   phone: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//     validate: {
//       validator: function (v) {
//         return /^\d{10}$/.test(v);
//       },
//       message: "Phone number must be 10 digits",
//     },
//   },
//   password: {
//     type: String,
//     required: true,
//     minlength: 6,
//     maxlength: 1024,
//   },
// });

// const Owner = mongoose.model("Owner", ownerSchema);

// exports.Owner = Owner;
// exports.ownerSchema = ownerSchema;
