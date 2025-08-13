const { Notification } = require("../models/notification");
const { emitNotification } = require("./socketUtils");
const winston = require("winston");

async function notifyUser(userId, message, options = {}) {
  const { type = "info", title, persist = true, realTime = true } = options;

  const notificationData = {
    user_id: userId,
    title: title || getDefaultTitle(type),
    message,
    type,
    seen: false,
  };

  let notification;

  if (persist) {
    notification = await Notification.create(notificationData);
    winston.info(`Persisted notification for user ${userId}`);
  }

  if (realTime) {
    try {
      await emitNotification(userId, notification || notificationData);
    } catch (err) {
      winston.error("WebSocket notification failed:", err);
    }
  }

  return notification;
}

function getDefaultTitle(type) {
  const titles = {
    info: "Information",
    warning: "Warning",
    error: "Alert",
    success: "Success",
  };
  return titles[type] || "Notification";
}

module.exports = notifyUser;
