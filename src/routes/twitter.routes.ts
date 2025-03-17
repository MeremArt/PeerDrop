import { Router } from "express";
import { param, query } from "express-validator";
import * as twitterController from "../controllers/twitter.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Protect all routes with authentication
router.use(authMiddleware);

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
router.get(
  "/engagement/tweet/:tweetId",
  [
    param("tweetId")
      .isString()
      .matches(/^[0-9]+$/)
      .withMessage("Invalid tweet ID"),
    query("threshold")
      .optional()
      .isInt({ min: 100 })
      .withMessage("Threshold must be at least 100"),
  ],
  twitterController.checkTweetEngagement
);

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
router.get(
  "/engagement/user/:username",
  [
    param("username")
      .isString()
      .matches(/^[A-Za-z0-9_]{1,15}$/)
      .withMessage("Invalid Twitter username"),
    query("threshold")
      .optional()
      .isInt({ min: 100 })
      .withMessage("Threshold must be at least 100"),
  ],
  twitterController.checkUserEngagement
);

export default router;
