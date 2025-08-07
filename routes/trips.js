const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const ownerOnly = require("../middleware/ownerOrAdminOnly");
const authorizeRole = require("../middleware/authorizeRole");

const tripController = require("../controllers/tripController");
const canStartorCompleteTrip = require("../middleware/tripAccess");

/**
 * @swagger
 * tags:
 *   name: Trips
 *   description: Trip management APIs
 */

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Create a new trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - truck_id
 *               - driver_id
 *               - start_city
 *               - end_city
 *               - total_km
 *               - cargo_weight
 *               - fuel_start
 *               - start_time
 *               - driver_snapshot
 *             properties:
 *               truck_id:
 *                 type: string
 *               driver_id:
 *                 type: string
 *               driver_snapshot:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   aadhar_number:
 *                     type: string
 *                   license_number:
 *                     type: string
 *               start_city:
 *                 type: string
 *               end_city:
 *                 type: string
 *               total_km:
 *                 type: number
 *               cargo_weight:
 *                 type: number
 *               fuel_start:
 *                 type: number
 *               start_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Trip created successfully
 *       400:
 *         description: Validation error
 */
// Create trip (Owner only)
router.post("/", [auth, ownerOnly], tripController.createTrip);

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Get all trips (admin sees all, owner sees theirs)
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, ongoing, completed, cancelled]
 *         description: Filter by trip status
 *     responses:
 *       200:
 *         description: List of trips
 */
// Get all trips (Owner sees theirs, Admin sees all)
router.get("/", auth, tripController.getAllTrips);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Get a trip by ID
 *     tags: [Trips]
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
 *         description: Trip details
 *       404:
 *         description: Trip not found
 */
// Get single trip
router.get("/:id", auth, tripController.getTripById);

/**
 * @swagger
 * /api/trips/{id}/start:
 *   put:
 *     summary: Start a scheduled trip
 *     tags: [Trips]
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
 *         description: Trip started
 *       400:
 *         description: Invalid status transition
 */
// Start trip
router.put(
  "/:id/start",
  [auth, canStartorCompleteTrip],
  tripController.startTrip
);

/**
 * @swagger
 * /api/trips/{id}/complete:
 *   put:
 *     summary: Complete an ongoing trip
 *     tags: [Trips]
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
 *         description: Trip completed
 *       400:
 *         description: Invalid status transition
 */
// Complete trip
router.put(
  "/:id/complete",
  [auth, canStartorCompleteTrip],
  tripController.completeTrip
);

/**
 * @swagger
 * /api/trips/{id}:
 *   delete:
 *     summary: Soft delete a trip (admin/owner only)
 *     tags: [Trips]
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
 *         description: Trip deleted
 *       404:
 *         description: Trip not found
 */
// Delete trip (admin or owner)
router.delete(
  "/:id",
  [auth, authorizeRole("admin", "owner")],
  tripController.deleteTrip
);

/**
 * @swagger
 * /api/trips/{id}/restore:
 *   put:
 *     summary: Restore a soft-deleted trip
 *     tags: [Trips]
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
 *         description: Trip restored
 *       400:
 *         description: Not deleted
 */
// Restore trip (admin or owner)
router.put(
  "/:id/restore",
  [auth, authorizeRole("admin", "owner")],
  tripController.restoreTrip
);

/**
 * @swagger
 * /api/trips/{id}/cancel:
 *   put:
 *     summary: Cancel a scheduled or ongoing trip
 *     tags: [Trips]
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
 *         description: Trip cancelled
 *       400:
 *         description: Invalid or already completed
 */
// Cancel trip (admin or owner)
router.put(
  "/:id/cancel",
  [auth, authorizeRole("owner", "admin")],
  tripController.cancelTrip
);

module.exports = router;
