const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const ownerOnly = require("../middleware/ownerOrAdminOnly");

const inviteController = require("../controllers/inviteController");

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

module.exports = router;
