const nodemailer = require("nodemailer");
const config = require("config");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.get("email.user"),
    pass: config.get("email.pass"),
  },
});

async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: config.get("email.user"),
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
}

module.exports = sendEmail;
