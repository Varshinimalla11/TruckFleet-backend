const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ownerOrAdminOnly = require("../middleware/ownerOrAdminOnly");
const authorizeRole = require("../middleware/authorizeRole");
const checkTruckOwnership = require("../middleware/checkTruckOwnership");
const truckController = require("../controllers/truckController");

/**
 * @swagger
 * tags:
 *   name: Trucks
 *   description: Truck management APIs
 */

/**
 * @swagger
 * /api/trucks:
 *   post:
 *     summary: Create a new truck
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plate_number
 *               - condition
 *               - mileage_factor
 *             properties:
 *               plate_number:
 *                 type: string
 *               condition:
 *                 type: string
 *                 enum: [active, maintenance_needed, in_maintenance, inactive]
 *               mileage_factor:
 *                 type: number
 *     responses:
 *       201:
 *         description: Truck created successfully
 *       400:
 *         description: Validation error or unauthorized
 */
// CREATE truck → only owner
router.post("/", [auth, ownerOrAdminOnly], truckController.createTruck);

/**
 * @swagger
 * /api/trucks:
 *   get:
 *     summary: Get all trucks
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trucks
 *       401:
 *         description: Unauthorized
 */
// GET all trucks → owner sees their own, admin sees all
router.get("/", auth, truckController.getAllTrucks);

/**
 * @swagger
 * /api/trucks/{id}:
 *   get:
 *     summary: Get a truck by ID
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Truck found
 *       403:
 *         description: Access denied
 *       404:
 *         description: Truck not found
 */
// GET one truck
router.get("/:id", [auth, checkTruckOwnership], truckController.getTruckById);

/**
 * @swagger
 * /api/trucks/{id}:
 *   put:
 *     summary: Update a truck
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plate_number:
 *                 type: string
 *               condition:
 *                 type: string
 *                 enum: [active, maintenance_needed, in_maintenance, inactive]
 *               mileage_factor:
 *                 type: number
 *     responses:
 *       200:
 *         description: Truck updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Truck not found
 */
// UPDATE truck
router.put("/:id", [auth, checkTruckOwnership], truckController.updateTruck);

/**
 * @swagger
 * /api/trucks/{id}:
 *   delete:
 *     summary: Delete a truck
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Truck deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Truck not found
 */
// DELETE truck
router.delete("/:id", [auth, checkTruckOwnership], truckController.deleteTruck);

module.exports = router;
