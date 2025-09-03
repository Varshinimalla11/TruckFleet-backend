import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "config";
import { User } from "../models/user.js";
import { OTP } from "../models/otp.js";
import { InviteToken } from "../models/inviteToken.js";
import { EmailVerification } from "../models/emailVerification.js";
import { validateUser } from "../validationModels/validateUser.js";
import { validateOTP } from "../validationModels/validateOtp.js";
import validation from "../validationModels/validatePasswordReset.js";

import { sendPasswordResetEmail, sendOTPEmail } from "../utils/emailService.js";
import notifyUser from "../utils/notifyUser.js";
import _ from "lodash";

const { validateEmail, validatePasswordReset } = validation;

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateVerificationToken = (email) => {
  return jwt.sign(
    {
      email: email.toLowerCase(),
      purpose: "email_verification",
    },
    config.get("jwtPrivateKey"),
    { expiresIn: "30m" } // 30 minutes expiry
  );
};

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).send({ message: "Email is already registered" });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Save new OTP
    const otpRecord = new OTP({
      email: email.toLowerCase(),
      otp: otpCode,
      expiresAt,
    });

    await otpRecord.save();

    try {
      await sendOTPEmail(email, otpCode);
      res.status(200).send({
        message: "OTP sent to email",

        otp: config.get("env") === "development" ? otpCode : undefined,
      });
    } catch (emailError) {
      // Clean up OTP record if email fails
      await OTP.deleteOne({ email: email.toLowerCase(), otp: otpCode });
      res.status(500).send({ message: "Failed to send OTP email" });
    }
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { error } = validateOTP(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const { email, otp } = req.body;

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
    });

    if (!otpRecord) {
      return res.status(400).send({ message: "Invalid OTP" });
    }

    // Check if OTP has expired
    if (otpRecord.expiresAt < Date.now()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).send({ message: "OTP has expired" });
    }

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.emailVerified = true;
      await user.save();
    } else {
      // Save verified email with 30-min expiry for registration
      await EmailVerification.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          verified: true,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        },
        { upsert: true }
      );
    }

    res.status(200).send({
      message: "OTP verified successfully",
      verified: true,
    });
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
};

export const register = async (req, res) => {
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

  // Check for verified email before registration
  const emailVerification = await EmailVerification.findOne({
    email: req.body.email.toLowerCase(),
    verified: true,
    expiresAt: { $gt: Date.now() },
  });

  if (!emailVerification) {
    return res.status(403).send({
      message: "Please verify your email with OTP before registering.",
    });
  }

  const allowedFields = ["name", "email", "phone", "password"];

  const filteredData = _.pick(req.body, allowedFields);
  filteredData.role = "owner";
  filteredData.emailVerified = true;

  user = new User(filteredData);
  await user.save();

  await EmailVerification.deleteOne({ email: req.body.email.toLowerCase() });
  const token = user.generateAuthToken();

  res.send({ token });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).send("Invalid email or password.");

  if (user.role === "owner" && !user.emailVerified) {
    return res.status(403).send({
      message: "Email not verified. Please complete the verification process.",
    });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).send("Invalid email or password.");

  const token = user.generateAuthToken();
  res.send({ token, user: _.pick(user, ["_id", "name", "email", "role"]) });
};

export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("ownedBy", "name");
  if (!user) return res.status(404).send("User not found.");
  res.send(user);
};

export const registerDriver = async (req, res) => {
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
      emailVerified: true,
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

export const getAllDrivers = async (req, res) => {
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

export const forgotPassword = async (req, res) => {
  try {
    const { error } = validateEmail(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.status(200).send({
        message: "If the email exists, a password reset link has been sent",
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

      // // Notify user about email sent
      // await notifyUser(
      //   user._id,
      //   "Password reset email sent to your email address",
      //   {
      //     type: "info",
      //     title: "Password Reset",
      //     persist: true,
      //   }
      // );
    } catch (emailError) {
      // Remove the token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(200).send({
        message: "If the email exists, a password reset link has been sent",
      });
    }

    res.status(200).send({
      message: "If the email exists, a password reset link has been sent",
    });
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { error } = validatePasswordReset(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send({
        message: "Invalid or expired reset token",
      });
    }
    // ✅ Check if new password is the same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).send({
        message: "New password cannot be the same as your current password",
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
      persist: true,
    });

    res.status(200).send({
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
};

export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send({
        valid: false,
        message: "Invalid or expired reset token",
      });
    }

    res.status(200).send({
      valid: true,
      message: "Token is valid",
    });
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = { ...req.body };

    // Prevent updates to email and role
    delete updateData.email;
    delete updateData.role;
    delete updateData.ownedBy;
    // Fetch current user to check role (optional, if you want role-specific validation)
    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).send("User not found.");

    // If driver, ensure required driver fields are included or validate specifically as needed
    if (currentUser.role === "driver") {
      // example: validate required fields present
      if (!updateData.aadhar_number || !updateData.license_number) {
        return res.status(400).send({
          message: "Aadhar and license numbers are required for drivers.",
        });
      }
    }

    // Update user document
    await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
      context: "query",
    });

    // Fetch updated user with owner name populated
    let updatedUserQuery = User.findById(userId).select("-password");
    if (currentUser.role === "driver") {
      updatedUserQuery = updatedUserQuery.populate("ownedBy", "name");
    }
    const updatedUser = await updatedUserQuery;

    if (!updatedUser) return res.status(404).send("User not found.");

    res.send(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).send({ message: "Server error" });
  }
};

export const adminOwners = async (req, res) => {
  try {
    const owners = await User.find({ role: "owner" }).select("-password");
    res.send(owners);
  } catch (error) {
    console.error("Error fetching owners:", error);
    res.status(500).send({ message: "Server error" });
  }
};
