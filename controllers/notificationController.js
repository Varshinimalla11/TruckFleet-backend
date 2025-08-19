const { Notification } = require("../models/notification");

// Get all notifications for logged-in user
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user_id: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json(notifications);
  } catch (err) {
    res.status(500).json("Internal Server Error");
  }
};

// Mark a notification as read
exports.markAsSeen = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        user_id: req.user._id, // Ensure user can only update their own notifications
      },
      { seen: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Mark all notifications as seen
exports.markAllAsSeen = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        user_id: req.user._id,
        seen: false,
      },
      { seen: true }
    );

    res.json({ success: true, message: "All notifications marked as seen" });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ success: true });
  } catch (err) {
   
    res.status(500).json({ message: "Internal Server Error" });
  }
};
