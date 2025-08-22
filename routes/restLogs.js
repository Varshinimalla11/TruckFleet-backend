import express from "express";
const router = express.Router();
import * as restLogController from "../controllers/restLogController.js";
import auth from "../middleware/auth.js";

// 📌 Get all rest logs by Trip ID
/**
 * @swagger
 * /api/rest-logs/trip/{tripId}:
 *   get:
 *     summary: Get all rest logs for a specific trip
 *     tags: [RestLogs]
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
 *         description: List of rest logs
 */
router.get("/trip/:tripId", auth, restLogController.getRestLogsByTrip);

// 📌 End rest and auto-start drive
/**
 * @swagger
 * /api/rest-logs/{rest_id}/end:
 *   put:
 *     summary: End a rest log and automatically start a new drive session
 *     tags: [RestLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rest_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the rest log
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fuel_at_rest_end:
 *                 type: number
 *                 example: 15.5
 *                 description: Remaining fuel in tank after driving
 *     responses:
 *       200:
 *         description: Rest ended and new drive session started
 */
router.put("/:rest_id/end", auth, restLogController.endRestAndStartDrive);

export default router;
