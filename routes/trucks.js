const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ownerOrAdminOnly = require("../middleware/ownerOrAdminOnly");
const authorizeRole = require("../middleware/authorizeRole");
const checkTruckOwnership = require("../middleware/checkTruckOwnership");
const truckController = require("../controllers/truckController");

// CREATE truck → only owner
router.post("/", [auth, ownerOrAdminOnly], truckController.createTruck);

// GET all trucks → owner sees their own, admin sees all
router.get("/", auth, truckController.getAllTrucks);

// GET one truck
router.get("/:id", [auth, checkTruckOwnership], truckController.getTruckById);

// UPDATE truck
router.put("/:id", [auth, checkTruckOwnership], truckController.updateTruck);

// DELETE truck
router.delete("/:id", [auth, checkTruckOwnership], truckController.deleteTruck);

module.exports = router;
