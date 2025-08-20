const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "Invalid email format",
      },
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: "Phone number must be 10 digits",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 1024,
    },
    role: {
      type: String,
      enum: ["admin", "owner", "driver"],
      required: true,
    },
    ownedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // assuming the owner is also in User collection
      required: function () {
        return this.role === "driver";
      },
    },
    aadhar_number: {
      type: String,
      required: function () {
        return this.role === "driver";
      },
      match: /^\d{12}$/,
    },
    license_number: {
      type: String,
      required: function () {
        return this.role === "driver";
      },
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
userSchema.index({ role: 1 });
userSchema.index({ ownedBy: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ resetPasswordExpires: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, role: this.role },
    config.get("jwtPrivateKey")
  );
  return token;
};

userSchema.methods.generatePasswordResetToken = function () {
  const crypto = require("crypto");
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = resetToken;
  this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  return resetToken;
};

userSchema.methods.clearPasswordResetToken = function () {
  this.resetPasswordToken = undefined;
  this.resetPasswordExpires = undefined;
};

const User = mongoose.model("User", userSchema);

exports.User = User;
exports.userSchema = userSchema;
