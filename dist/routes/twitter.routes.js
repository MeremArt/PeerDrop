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
const twitterController = __importStar(require("../controllers/twitter.controller"));
// import { authMiddleware } from "../middleware/auth.middleware";
const router = (0, express_1.Router)();
// Protect all routes with authentication
// router.use(authMiddleware);
/**
 * @swagger
 * /api/twitter/engagement/tweet/{tweetId}:
 *   get:
 *     summary: Check tweet engagement metrics
 *     tags: [Twitter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tweetId
 *         required: true
 *         schema:
 *           type: string
 *         description: Twitter tweet ID
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           minimum: 100
 *           default: 10000
 *         description: Minimum follower count to consider high engagement
 *     responses:
 *       200:
 *         description: Tweet engagement metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isHighEngagement:
 *                   type: boolean
 *                   description: Whether the account meets high engagement threshold
 *                 authorMetrics:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     name:
 *                       type: string
 *                     profileImageUrl:
 *                       type: string
 *                     followerCount:
 *                       type: integer
 *                     followingCount:
 *                       type: integer
 *                     tweetCount:
 *                       type: integer
 *                     followerRatio:
 *                       type: string
 *                 tweetMetrics:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     text:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     likeCount:
 *                       type: integer
 *                     retweetCount:
 *                       type: integer
 *                     replyCount:
 *                       type: integer
 *                     engagementRate:
 *                       type: string
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/engagement/tweet/:tweetId", [
    (0, express_validator_1.param)("tweetId")
        .isString()
        .matches(/^[0-9]+$/)
        .withMessage("Invalid tweet ID"),
    (0, express_validator_1.query)("threshold")
        .optional()
        .isInt({ min: 100 })
        .withMessage("Threshold must be at least 100"),
], twitterController.checkTweetEngagement);
/**
 * @swagger
 * /api/twitter/engagement/user/{username}:
 *   get:
 *     summary: Check user engagement metrics
 *     tags: [Twitter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Za-z0-9_]{1,15}$'
 *         description: Twitter username
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           minimum: 100
 *           default: 10000
 *         description: Minimum follower count to consider high engagement
 *     responses:
 *       200:
 *         description: User engagement metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isHighEngagement:
 *                   type: boolean
 *                 userMetrics:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     name:
 *                       type: string
 *                     verified:
 *                       type: boolean
 *                     description:
 *                       type: string
 *                     profileImageUrl:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     followerCount:
 *                       type: integer
 *                     followingCount:
 *                       type: integer
 *                     tweetCount:
 *                       type: integer
 *                     followerRatio:
 *                       type: string
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/twitter/verification/verify:
 *   post:
 *     summary: Verify a Twitter account using posted tweet
 *     tags: [Twitter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - tweetUrl
 *             properties:
 *               userId:
 *                 type: string
 *                 format: mongodb-id
 *               tweetUrl:
 *                 type: string
 *                 description: URL of the verification tweet
 *     responses:
 *       200:
 *         description: Twitter account verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 twitterUsername:
 *                   type: string
 *                 isHighEngagement:
 *                   type: boolean
 *                 metrics:
 *                   type: object
 *       400:
 *         description: Invalid verification
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// Check user engagement
router.get("/engagement/user/:username", [
    (0, express_validator_1.param)("username")
        .isString()
        .matches(/^[A-Za-z0-9_]{1,15}$/)
        .withMessage("Invalid Twitter username"),
    (0, express_validator_1.query)("threshold")
        .optional()
        .isInt({ min: 100 })
        .withMessage("Threshold must be at least 100"),
], twitterController.checkUserEngagement);
exports.default = router;
