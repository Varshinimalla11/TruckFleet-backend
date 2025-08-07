const { Notification } = require("../models/notification");

// Get all notifications for logged-in user
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user_id: req.user._id,
    }).sort({ createdAt: -1 });
    res.send(notifications);
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { seen: true },
    { new: true }
  );

  if (!notification) return res.status(404).send("Notification not found");
  res.send(notification);
};
