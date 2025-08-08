const express = require("express");
const router = express.Router();
const driveSessionController = require("../controllers/driveSessionController");
const auth = require("../middleware/auth");

// 📌 Create drive session manually (if allowed)
/**
 * @swagger
 * /api/drive-sessions:
 *   post:
 *     summary: Manually create a drive session (optional)
 *     tags: [DriveSessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trip_id:
 *                 type: string
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               fuel_used:
 *                 type: number
 *               km_covered:
 *                 type: number
 *     responses:
 *       201:
 *         description: Drive session created
 */
router.post("/", auth, driveSessionController.createDriveSession);

// 📌 End drive session and start rest
/**
 * @swagger
 * /api/drive-sessions/{session_id}/end:
 *   put:
 *     summary: End a drive session and start a rest log
 *     tags: [DriveSessions]
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the drive session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fuel_left:
 *                 type: number
 *                 example: 15.5
 *                 description: Remaining fuel in tank after driving
 *     responses:
 *       200:
 *         description: Drive session ended and rest started
 */
router.put(
  "/:session_id/end",
  auth,
  driveSessionController.endDriveSessionAndStartRest
);

// 📌 Get all drive sessions by trip
/**
 * @swagger
 * /api/drive-sessions/trip/{tripId}:
 *   get:
 *     summary: Get all drive sessions for a trip
 *     tags: [DriveSessions]
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
 *         description: List of drive sessions
 */
router.get("/trip/:tripId", auth, driveSessionController.getSessionsByTrip);

module.exports = router;
