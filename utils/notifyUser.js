const { Notification } = require("../models/notification");

async function notifyUser(userId, message) {
  await Notification.create({ user_id: userId, message });
}

module.exports = notifyUser;
