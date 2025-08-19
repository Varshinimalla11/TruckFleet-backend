const crypto = require("crypto");
const { InviteToken } = require("../models/inviteToken");
const sendEmail = require("../utils/emailService");

exports.sendInviteToken = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).send("Driver email is required.");

    // generate secure token
    const token = crypto.randomBytes(10).toString("hex");
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // save to DB
    const invite = new InviteToken({
      token,
      email,
      owner: req.user._id,
      expiresAt,
    });

    await invite.save();

    // Send invite email
    const link = `http://localhost:3000/register-driver?token=${token}`;
    const subject = "Driver Registration Invite";
    const message = `You've been invited to register as a driver. Use this link:\n\n${link}\n\nThis link expires in 1 hour.`;

    await sendEmail(email, subject, message);

    res.send({ message: "Invite sent successfully", token });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to send invite",
      error: err.message,
    });
  }
};

exports.verifyInviteToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).send({ message: "Token is required" });

    const tokenDoc = await InviteToken.findOne({ token, isUsed: false });
    if (!tokenDoc || tokenDoc.expiresAt < Date.now()) {
      return res.status(400).send({ message: "Invalid or expired token" });
    }

    res.send({ valid: true, email: tokenDoc.email });
  } catch (err) {
    res.status(500).send({ message: "Server error" });
  }
};
