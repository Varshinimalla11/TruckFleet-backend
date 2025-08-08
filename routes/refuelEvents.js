const express = require("express");
const router = express.Router();
const refuelController = require("../controllers/refuelEventController");
const auth = require("../middleware/auth");

/**
 * @swagger
 * /api/refuel-events:
 *   post:
 *     summary: Log a new refuel event
 *     tags: [RefuelEvents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trip_id
 *               - event_time
 *               - fuel_before
 *               - fuel_added
 *               - fuel_after
 *             properties:
 *               trip_id:
 *                 type: string
 *               event_time:
 *                 type: string
 *                 format: date-time
 *               fuel_before:
 *                 type: number
 *               fuel_added:
 *                 type: number
 *               fuel_after:
 *                 type: number
 *               payment_mode:
 *                 type: string
 *                 enum: [cash, card, upi, other]
 *     responses:
 *       201:
 *         description: Refuel event logged
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Trip not found
 */
router.post("/", auth, refuelController.logRefuel);

/**
 * @swagger
 * /api/refuel-events/{tripId}:
 *   get:
 *     summary: Get all refuel logs for a trip
 *     tags: [RefuelEvents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         schema:
 *           type: string
 *         required: true
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: List of refuel logs
 *       403:
 *         description: Access denied
 *       404:
 *         description: Trip not found
 */
router.get("/:tripId", auth, refuelController.getRefuelLogsByTrip);

module.exports = router;
