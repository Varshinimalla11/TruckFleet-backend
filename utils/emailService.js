import nodemailer from "nodemailer";
import config from "config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.get("email.user"),
    pass: config.get("email.pass"),
  },
});

async function sendEmail(to, subject, text, html = null) {
  const mailOptions = {
    from: config.get("email.user"),
    to,
    subject,
    text,
    html: html || text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
    throw err;
  }
}
async function sendPasswordResetEmail(email, resetToken) {
  const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
  const subject = "Password Reset Request - TFM";
  const text = `You requested to reset your password. Use this token: ${resetToken}\nOr click: ${resetLink}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You requested to reset your password for TFM account. Click the button below to reset it:</p>
      <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 16px 0;">
        Reset Password
      </a>
      <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">Or use this token manually: ${resetToken}</p>
    </div>
  `;

  return await sendEmail(email, subject, text, html);
}

async function sendOTPEmail(email, otp) {
  const subject = "Email Verification - TFM";
  const text = `Your verification code is: ${otp}. This code will expire in 10 minutes.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Email Verification</h2>
      <p>Thank you for registering with TFM. Use the verification code below to complete your registration:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
        <h1 style="margin: 0; color: #333; letter-spacing: 5px;">${otp}</h1>
      </div>
      <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;

  return await sendEmail(email, subject, text, html);
}

export { sendEmail, sendPasswordResetEmail, sendOTPEmail };
