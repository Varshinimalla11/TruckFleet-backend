const jwt = require("jsonwebtoken");
const config = require("config");

function auth(req, res, next) {
  let token = req.header("x-auth-token");

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return res.status(401).send("Access Denied. No Token Provided");

  try {
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send("Invalid token");
  }
}
module.exports = auth;

// const { InviteToken } = require("../models/inviteToken");

// exports.registerDriver = async (req, res) => {
//   const { inviteToken, name, email, phone, aadhar_number, license_number, password } = req.body;

//   if (!inviteToken) return res.status(400).send("Invite token is required.");

//   const tokenDoc = await InviteToken.findOne({ token: inviteToken });
//   if (!tokenDoc || tokenDoc.expiresAt < Date.now()) {
//     return res.status(400).send("Token is invalid or expired.");
//   }

//   // Check if already registered
//   const existing = await User.findOne({ email });
//   if (existing) return res.status(400).send("User already registered.");

//   const user = new User({
//     name,
//     email,
//     phone,
//     password,
//     role: "driver",
//     aadhar_number,
//     license_number,
//     ownedBy: tokenDoc.owner, // link to owner
//   });

//   await user.save();
//   await InviteToken.deleteOne({ token: inviteToken }); // one-time use

//   const token = user.generateAuthToken();
//   res.send({ token, user: _.pick(user, ["_id", "name", "email", "role"]) });
// };
