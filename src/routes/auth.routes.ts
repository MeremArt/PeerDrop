import { Router, Request, Response, NextFunction } from "express";
import { body, param } from "express-validator";
import * as authController from "../controllers/auth.controller";

const router = Router();

// Middleware to standardize TikTok usernames (remove @ if present)
// Middleware to standardize TikTok usernames
const standardizeTiktokUsername = (
  req: {
    body: { tiktokUsername: string; newTiktokUsername: string };
    params: { tiktokUsername: string };
  },
  res: any,
  next: () => void
) => {
  if (req.body.tiktokUsername) {
    req.body.tiktokUsername = req.body.tiktokUsername.replace(/^@/, "");
  }
  if (req.body.newTiktokUsername) {
    req.body.newTiktokUsername = req.body.newTiktokUsername.replace(/^@/, "");
  }
  if (req.params.tiktokUsername) {
    req.params.tiktokUsername = req.params.tiktokUsername.replace(/^@/, "");
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and registration endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - tiktokUsername
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: User's password (min 6 characters)
 *               tiktokUsername:
 *                 type: string
 *                 pattern: '^@?[a-zA-Z0-9_.]{1,24}$'
 *                 description: TikTok username (with or without @ symbol)
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     tiktokUsername:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Server error
 */

router.post(
  "/register",
  standardizeTiktokUsername,
  [
    body("email")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("tiktokUsername")
      .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
      .withMessage(
        "Invalid TikTok username format (e.g., @username or username)"
      ),
  ],
  authController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tiktokUsername
 *               - password
 *             properties:
 *               tiktokUsername:
 *                 type: string
 *                 pattern: '^@?[a-zA-Z0-9_.]{1,24}$'
 *                 description: TikTok username (with or without @ symbol)
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     tiktokUsername:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post(
  "/login",
  standardizeTiktokUsername,
  [
    body("tiktokUsername")
      .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
      .withMessage(
        "Invalid TikTok username format (e.g., @username or username)"
      ),
    body("password").exists().withMessage("Password is required"),
  ],
  authController.login
);

router.get(
  "/tiktok/:tiktokUsername",
  standardizeTiktokUsername,
  [
    param("tiktokUsername")
      .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
      .withMessage("Invalid TikTok username format"),
  ],
  authController.getUserByTiktokUsername
);
// Update TikTok username
router.patch(
  "/update-tiktok-username",
  standardizeTiktokUsername,
  [
    body("newTiktokUsername")
      .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
      .withMessage("Invalid TikTok username format"),
  ],
  authController.updateTiktokUsername
);
export default router;
