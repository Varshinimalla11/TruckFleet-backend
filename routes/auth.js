const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");
const {validateEmail, validatePassword} = require("../validationModels/validatePasswordReset");
//const admin = require("../middleware/authorizeRole");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & Login API
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 example: driver@example.com
 *               password:
 *                 type: string
 *                 example: StrongPassword123
 *               name:
 *                 type: string
 *                 example: name
 *               phone:
 *                 type: string
 *                 example: number
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request or already registered
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: driver@example.com
 *               password:
 *                 type: string
 *                 example: StrongPassword123
 *     responses:
 *       200:
 *         description: Successful login, returns token
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged-in user's info
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *       401:
 *         description: Unauthorized
 */
router.get("/me", auth, authController.getCurrentUser);

/**
 * @swagger
 * /api/auth/register-driver:
 *   post:
 *     summary: Register a new driver using an invite token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - name
 *               - email
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Invite token sent to the driver
 *                 example: abc123def456
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: driver@example.com
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 example: StrongPassword123
 *               aadhar_number:
 *                 type: string
 *                 example: "1234-5678-9012"
 *               license_number:
 *                 type: string
 *                 example: "DL-1234567890"
 *     responses:
 *       200:
 *         description: Driver registered successfully and returns auth token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT auth token
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: driver
 *       400:
 *         description: Bad request, invalid or expired token, email mismatch, or user already registered
 *       500:
 *         description: Server error
 */
router.post("/register-driver", authController.registerDriver);

/**
 * @swagger
 * /api/auth/my-drivers:
 *   get:
 *     summary: Get list of drivers
 *     description: |
 *       - If **owner**, returns only the drivers they own.
 *       - If **admin**, returns all drivers.
 *       - If **driver**, access is denied.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of drivers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "64b6f29d8f4a3a001fbd1234"
 *                   name:
 *                     type: string
 *                     example: "John Driver"
 *                   email:
 *                     type: string
 *                     example: "driver@example.com"
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *                   role:
 *                     type: string
 *                     example: "driver"
 *                   aadhar_number:
 *                     type: string
 *                     example: "1234-5678-9012"
 *                   license_number:
 *                     type: string
 *                     example: "DL-1234567890"
 *                   ownedBy:
 *                     type: string
 *                     example: "64b6f29d8f4a3a001fbd9876"
 *       403:
 *         description: Access denied (if the logged-in user is a driver)
 *       500:
 *         description: Server error
 */
router.get("/my-drivers", auth, authController.getAllDrivers);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
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
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: If email exists, reset link sent
 *       400:
 *         description: Invalid email format
 *       500:
 *         description: Server error
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from email
 *               newPassword:
 *                 type: string
 *                 example: NewStrongPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token, password requirements not met, or new password same as current
 *       500:
 *         description: Server error
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @swagger
 * /api/auth/validate-reset-token/{token}:
 *   get:
 *     summary: Validate reset token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Reset token to validate
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Token is invalid or expired
 *       500:
 *         description: Server error
 */
router.get("/validate-reset-token/:token", authController.validateResetToken);



module.exports = router;

