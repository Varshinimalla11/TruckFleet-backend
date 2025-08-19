const mongoose = require("mongoose");
const { Truck } = require("../models/truck");
const { validateTruck } = require("../validationModels/validateTruck");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id); 
}

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

 try {
    await truck.save();
    res.status(201).send(truck);
  } catch (err) {
   
    res.status(500).send("Server Error");
  }
};


// GET /api/trucks
exports.getAllTrucks = async (req, res) => {
  try {
    if (req.user.role === "owner") {
      const trucks = await Truck.find({ owner_id: req.user._id });
      return res.send(trucks);
    }
    if (req.user.role === "admin") {
      const trucks = await Truck.find({});
      return res.send(trucks);
    }
    if (req.user.role === "driver") {
      return res.status(403).json({ message: "Drivers are not permitted to view truck list." });
    }
    res.status(403).json({ message: "Unauthorized role" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// GET /api/trucks/:id

exports.getTruckById = async (req, res) => {
  const  id  = req.params.id;
  if (!id || !isValidObjectId(id)) {
    return res.status(400).send('Invalid or missing truck ID');
  }
 try {
    const truck = await Truck.findById(id);
    if (!truck) return res.status(404).send("Truck not found");
    res.send(truck);
  } catch (err) {
    
    res.status(500).send("Server Error");
  }
};

// PUT /api/trucks/:id
exports.updateTruck = async (req, res) => {
  const id = req.params.id;

  if (!id || !isValidObjectId(id)) {
    return res.status(400).send("Invalid or missing truck ID");
  }

  const { error } = validateTruck(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const updates = (({ plate_number, condition, mileage_factor }) => ({
    plate_number,
    condition,
    mileage_factor,
  }))(req.body);

  try {
    const truck = await Truck.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!truck) return res.status(404).send("Truck not found");
    res.send(truck);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// DELETE /api/trucks/:id
exports.deleteTruck = async (req, res) => {
  const id = req.params.id;

  if (!id || !isValidObjectId(id)) {
    return res.status(400).send("Invalid or missing truck ID");
  }

  try {
    const truck = await Truck.findByIdAndDelete(id);
    if (!truck) return res.status(404).send("Truck not found");
    res.send({ message: "Truck deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};