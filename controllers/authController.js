const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
const { User } = require("../models/user");
const { validateUser } = require("../validationModels/validateUser");
const _ = require("lodash");

exports.register = async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  const allowedFields = ["name", "email", "phone", "password", "role"];
  if (req.body.role === "driver") {
    allowedFields.push("aadhar_number", "license_number", "ownedBy");
  }

  const filteredData = _.pick(req.body, allowedFields);
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
