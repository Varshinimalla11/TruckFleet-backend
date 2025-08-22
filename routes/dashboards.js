import express from "express";
const router = express.Router();
import auth from "../middleware/auth.js";
import * as dashboardController from "../controllers/dashboardController.js";
import authorizeRole from "../middleware/authorizeRole.js";

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics and recent activities
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTrucks:
 *                   type: number
 *                 totalTrips:
 *                   type: number
 *                 totalDrivers:
 *                   type: number
 *                 ongoingTrips:
 *                   type: number
 *       500:
 *         description: Internal server error
 */
router.get(
  "/stats",
  [auth, authorizeRole("owner", "admin")],
  dashboardController.getStats
);

/**
 * @swagger
 * /api/dashboard/recent-trips:
 *   get:
 *     summary: Get 5 most recent trips
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent trips
 *       500:
 *         description: Internal server error
 */
router.get(
  "/recent-trips",
  [auth, authorizeRole("owner", "admin")],
  dashboardController.getRecentTrips
);

/**
 * @swagger
 * /api/dashboard/recent-drive-sessions:
 *   get:
 *     summary: Get 5 most recent drive sessions
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent drive sessions
 *       500:
 *         description: Internal server error
 */
router.get(
  "/recent-drive-sessions",
  auth,
  dashboardController.getRecentDriveSessions
);

export default router;
