const { Truck } = require("../models/truck");
const { validateTruck } = require("../validationModels/validateTruck");

// POST /api/trucks
exports.createTruck = async (req, res) => {
  const { error } = validateTruck(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const truck = new Truck({
    plate_number: req.body.plate_number,
    condition: req.body.condition,
    mileage_factor: req.body.mileage_factor,
    owner_id: req.user._id,
  });

  await truck.save();
  res.status(201).send(truck);
};

// GET /api/trucks
exports.getAllTrucks = async (req, res) => {
  // Only owner sees their own trucks; admin sees all; driver sees nothing.
  if (req.user.role === "owner") {
    const trucks = await Truck.find({ owner_id: req.user._id });
    return res.send(trucks);
  }
  if (req.user.role === "admin") {
    const trucks = await Truck.find({});
    return res.send(trucks);
  }
  if (req.user.role === "driver") {
    // show only the truck assigned to a trip
    return res.status(403).json({ message: "Drivers are not permitted to view truck list." });
  }
  res.status(403).json({ message: "Unauthorized role" });
};

// GET /api/trucks/:id
exports.getTruckById = async (req, res) => {
  const truck = await Truck.findById(req.params.id);
  if (!truck) return res.status(404).send("Truck not found");
  res.send(truck);
  
};

// PUT /api/trucks/:id
exports.updateTruck = async (req, res) => {
  const { error } = validateTruck(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const updates = (({ plate_number, condition, mileage_factor }) => ({
    plate_number,
    condition,
    mileage_factor,
  }))(req.body);

  const truck = await Truck.findByIdAndUpdate(req.params.id, updates, {
    new: true,
  });
  if (!truck) return res.status(404).send("Truck not found");
  res.send(truck);
};

// DELETE /api/trucks/:id
exports.deleteTruck = async (req, res) => {
  const truck = await Truck.findByIdAndDelete(req.params.id);
  if (!truck) return res.status(404).send("Truck not found");
  res.send({ message: "Truck deleted successfully" });
};
