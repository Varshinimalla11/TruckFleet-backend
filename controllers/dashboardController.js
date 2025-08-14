const Trip = require("../models/trip");
const DriveSession = require("../models/driveSession");
const { Truck } = require("../models/truck");
const { User } = require("../models/user");

// GET dashboard stats
exports.getStats = async (req, res) => {
  try {
    const totalTrucks = await Truck.countDocuments();
    const totalTrips = await Trip.countDocuments();
    const totalDrivers = await User.countDocuments({ role: "driver" });
    const ongoingTrips = await Trip.countDocuments({ status: "ongoing" });

    res.json({
      totalTrucks,
      totalTrips,
      totalDrivers,
      ongoingTrips,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET recent trips
exports.getRecentTrips = async (req, res) => {
  try {
    const trips = await Trip.find()
      .sort({ start_time: -1 })
      .limit(5)
      .populate("truck_id")
      .populate("driver_id");

    res.json(trips);
  } catch (error) {
    console.error("Error fetching recent trips:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET recent drive sessions
exports.getRecentDriveSessions = async (req, res) => {
  try {
    const sessions = await DriveSession.find()
      .sort({ start_time: -1 })
      .limit(5)
      .populate({
        path: "trip_id",
        populate: { path: "driver_id truck_id" },
      });

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching recent drive sessions:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
