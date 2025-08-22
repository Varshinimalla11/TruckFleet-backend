import express from "express";
const router = express.Router();

import auth from "../middleware/auth.js";
import ownerOnly from "../middleware/ownerOrAdminOnly.js";
import authorizeRole from "../middleware/authorizeRole.js";

import * as tripController from "../controllers/tripController.js";
import canStartorCompleteTrip from "../middleware/tripAccess.js";

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
router.get(
  "/",
  [auth, authorizeRole("owner", "admin")],
  tripController.getAllTrips
);

/**
 * @swagger
 * /api/trips/my-trips:
 *   get:
 *     summary: Get trips assigned to the logged-in driver
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trips assigned to the logged-in driver
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
 *       403:
 *         description: Only drivers can view their trips
 */
router.get("/my-trips", auth, tripController.getMyTrips);

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
 *   patch:
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
router.patch(
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fuel_left
 *             properties:
 *               fuel_left:
 *                 type: number
 *                 example: 45.5
 *     responses:
 *       200:
 *         description: Trip completed successfully
 *       400:
 *         description: Invalid status transition or missing fuel_left
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
 *   put:
 *     summary: Update a trip's details
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Trip ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *               status:
 *                 type: string
 *                 enum: [scheduled, ongoing, completed, cancelled]
 *             example:
 *               start_city: "Bangalore"
 *               end_city: "Chennai"
 *               total_km: 350
 *               cargo_weight: 2000
 *               fuel_start: 50
 *               start_time: "2025-08-14T09:00:00Z"
 *               status: "scheduled"
 *     responses:
 *       200:
 *         description: Trip updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 trip:
 *                   $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Cannot update completed or cancelled trip
 *       403:
 *         description: Drivers cannot update trips
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  [auth, authorizeRole("admin", "owner")],
  tripController.updateTrip
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
 *   patch:
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
router.patch(
  "/:id/restore",
  [auth, authorizeRole("admin", "owner")],
  tripController.restoreTrip
);

/**
 * @swagger
 * /api/trips/{id}/cancel:
 *   patch:
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
router.patch(
  "/:id/cancel",
  [auth, authorizeRole("owner", "admin")],
  tripController.cancelTrip
);

export default router;
