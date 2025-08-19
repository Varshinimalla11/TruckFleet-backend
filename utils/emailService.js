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
    
  } catch (err) {
    throw new Error(`Failed to send email: ${err.message}`);
  }
}

module.exports = sendEmail;
