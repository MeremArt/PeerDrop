"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const authController = __importStar(require("../controllers/auth.controller"));
const router = (0, express_1.Router)();
// Middleware to standardize TikTok usernames (remove @ if present)
// Middleware to standardize TikTok usernames
const standardizeTiktokUsername = (req, res, next) => {
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
router.post("/register", standardizeTiktokUsername, [
    (0, express_validator_1.body)("email")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    (0, express_validator_1.body)("tiktokUsername")
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid TikTok username format (e.g., @username or username)"),
], authController.register);
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
router.post("/login", standardizeTiktokUsername, [
    (0, express_validator_1.body)("tiktokUsername")
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid TikTok username format (e.g., @username or username)"),
    (0, express_validator_1.body)("password").exists().withMessage("Password is required"),
], authController.login);
router.get("/tiktok/:tiktokUsername", standardizeTiktokUsername, [
    (0, express_validator_1.param)("tiktokUsername")
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid TikTok username format"),
], authController.getUserByTiktokUsername);
// Update TikTok username
router.patch("/update-tiktok-username", standardizeTiktokUsername, [
    (0, express_validator_1.body)("newTiktokUsername")
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid TikTok username format"),
], authController.updateTiktokUsername);
exports.default = router;
