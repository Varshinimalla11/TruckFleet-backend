const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
const { User } = require("../models/user");
const { validateUser } = require("../validationModels/validateUser");
const { InviteToken } = require("../models/inviteToken");
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
