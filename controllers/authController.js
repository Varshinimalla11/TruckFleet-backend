const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("config");
const { User } = require("../models/user");
const { validateUser } = require("../validationModels/validateUser");
const { InviteToken } = require("../models/inviteToken");
const {validatePasswordReset,validateEmail} = require("../validationModels/validatePasswordReset");
const { sendPasswordResetEmail } = require("../utils/emailService");
const notifyUser = require("../utils/notifyUser");
const _ = require("lodash");

exports.register = async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  let user = await User.findOne({ email: req.body.email });
  if (user)
    return res.status(409).send({ message: "Email is already registered" });

  if (req.body.phone) {
    const existingPhone = await User.findOne({ phone: req.body.phone });
    if (existingPhone) {
      return res
        .status(409)
        .send({ message: "Phone number is already registered" });
    }
  }

  const allowedFields = ["name", "email", "phone", "password"];
  // if (req.body.role === "driver") {
  //   allowedFields.push("aadhar_number", "license_number", "ownedBy");
  // }
  const filteredData = _.pick(req.body, allowedFields);
  filteredData.role = "owner";

  user = new User(filteredData);
  await user.save();

  const token = user.generateAuthToken();

  res.send({ token });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).send("Invalid email or password.");

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).send("Invalid email or password.");

  const token = user.generateAuthToken();
  res.send({ token, user: _.pick(user, ["_id", "name", "email", "role"]) });
};

exports.getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) return res.status(404).send("User not found.");
  res.send(user);
};

exports.registerDriver = async (req, res) => {
  try {
    const {
      token,
      name,
      email,
      phone,
      password,
      aadhar_number,
      license_number,
    } = req.body;

    if (!token)
      return res.status(400).send({ message: "Invite token is required" });

    // Find invite token
    const tokenDoc = await InviteToken.findOne({ token, isUsed: false });
    if (!tokenDoc || tokenDoc.expiresAt < Date.now()) {
      return res
        .status(400)
        .send({ message: "Invalid or expired invite token" });
    }

    // Ensure email in form matches invited email
    if (tokenDoc.email.toLowerCase() !== email.toLowerCase()) {
      return res
        .status(400)
        .send({ message: "Email does not match the invite" });
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).send({ message: "User already registered" });

    // Create driver, ownedBy from token
    const user = new User({
      name,
      email,
      phone,
      password,
      role: "driver",
      ownedBy: tokenDoc.owner,
      aadhar_number,
      license_number,
    });

    await user.save();

    // Mark invite as used
    tokenDoc.isUsed = true;
    await tokenDoc.save();

    const authToken = user.generateAuthToken();
    res.send({
      token: authToken,
      user: _.pick(user, ["_id", "name", "email", "role"]),
    });
  } catch (err) {
    res.status(500).send({ message: "Server error" });
  }
};

exports.getAllDrivers = async (req, res) => {
  try {
    // If the user is owner, fetch only their drivers
    if (req.user.role === "owner") {
      const drivers = await User.find({
        role: "driver",
        ownedBy: req.user._id,
      }).select("-password");
      return res.send(drivers);
    }

    // If admin, return all drivers
    if (req.user.role === "admin") {
      const drivers = await User.find({ role: "driver" }).select("-password");
      return res.send(drivers);
    }

    // If driver tries to access
    return res.status(403).send({ message: "Access denied" });
  } catch (err) {
    res.status(500).send({ message: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { error } = validateEmail(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    const { email } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.status(200).send({ 
        message: "If the email exists, a password reset link has been sent"
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      
      // Notify user about email sent
      await notifyUser(user._id, "Password reset email sent to your email address", {
        type: "info",
        title: "Password Reset",
        persist: true
      });

    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Remove the token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
       return res.status(200).send({ 
        message: "If the email exists, a password reset link has been sent"
      });    }

    res.status(200).send({ 
      message: "If the email exists, a password reset link has been sent"
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).send({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { error } = validatePasswordReset(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send({ 
        message: "Invalid or expired reset token" 
      });
    }
// ✅ Check if new password is the same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).send({ 
        message: "New password cannot be the same as your current password" 
      });
    }
    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Notify user about successful password reset
    await notifyUser(user._id, "Your password has been reset successfully", {
      type: "success",
      title: "Password Reset",
      persist: true
    });

    res.status(200).send({ 
      message: "Password reset successfully" 
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).send({ message: "Server error" });
  }
};

exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send({ 
        valid: false, 
        message: "Invalid or expired reset token" 
      });
    }

    res.status(200).send({ 
      valid: true, 
      message: "Token is valid" 
    });

  } catch (error) {
    console.error("Validate token error:", error);
    res.status(500).send({ message: "Server error" });
  }
};