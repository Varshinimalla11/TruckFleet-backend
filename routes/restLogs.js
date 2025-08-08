const express = require("express");
const router = express.Router();
const restLogController = require("../controllers/restLogController");
const auth = require("../middleware/auth");

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
 *               fuel_left:
 *                 type: number
 *                 example: 15.5
 *                 description: Remaining fuel in tank after driving
 *     responses:
 *       200:
 *         description: Rest ended and new drive session started
 */
router.put("/:rest_id/end", auth, restLogController.endRestAndStartDrive);

module.exports = router;
