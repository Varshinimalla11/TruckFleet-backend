import express from "express";
const router = express.Router();

import auth from "../middleware/auth.js";
import ownerOnly from "../middleware/ownerOrAdminOnly.js";

import * as inviteController from "../controllers/inviteController.js";

/**
 * @swagger
 * /api/invitetokens/send:
 *   post:
 *     summary: Send invite token to a driver
 *     tags: [InviteToken]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: driver@example.com
 *     responses:
 *       200:
 *         description: Invite sent successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Unauthorized
 */

// POST /api/invitetokens/send
router.post("/send", [auth, ownerOnly], inviteController.sendInviteToken);

/**
 * @swagger
 * /api/invitetokens/verify:
 *   post:
 *     summary: Verify an invite token
 *     tags: [InviteToken]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123def456
 *     responses:
 *       200:
 *         description: Valid invite token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 email:
 *                   type: string
 *                   example: driver@example.com
 *       400:
 *         description: Invalid or expired token, or token missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post("/verify", inviteController.verifyInviteToken);

export default router;
