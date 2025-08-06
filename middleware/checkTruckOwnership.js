const { Truck } = require("../models/truck");

module.exports = async function (req, res, next) {
  const truck = await Truck.findById(req.params.id);

  if (!truck) return res.status(404).send("Truck not found");

  if (!truck.owner_id) {
    return res.status(400).send("Truck has no owner assigned.");
  }

  const isOwner = truck.owner_id?.toString() === req.user._id;
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).send("Access denied. You don't own this truck.");
  }

  next();
};
