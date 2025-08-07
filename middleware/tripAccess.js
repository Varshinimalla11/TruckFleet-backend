const Trip = require("../models/trip");

module.exports = async function (req, res, next) {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).send("Trip not found");

  // ✅ Only allow the assigned driver to start/complete trip
  if (
    req.user.role === "driver" &&
    trip.driver_id.toString() === req.user._id
  ) {
    return next();
  }

  // ❌ Block all others (including owner/admin)
  return res
    .status(403)
    .send("Only the assigned driver can start or complete this trip.");

  // // Admins and owners can access
  // if (req.user.role === "admin" || req.user.role === "owner") return next();

  // // Drivers can access only their assigned trip
  // if (req.user.role === "driver" && trip.driver_id.toString() === req.user._id)
  //   return next();

  // return res.status(403).send("Access denied. You cannot modify this trip.");
};
