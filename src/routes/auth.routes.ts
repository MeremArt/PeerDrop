import { Router, Request, Response, NextFunction } from "express";
import { body, param } from "express-validator";
import * as authController from "../controllers/auth.controller";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import express from "express";

const router = express.Router();

// Custom interface that extends AuthRequest for standardization middleware
interface StandardizedRequest extends AuthRequest {
  body: {
    tiktokUsername?: string;
    newTiktokUsername?: string;
    [key: string]: any;
  };
  params: {
    tiktokUsername?: string;
    [key: string]: any;
  };
}

// Middleware to standardize TikTok usernames (remove @ if present)
const standardizeTiktokUsername = (
  req: StandardizedRequest,
  res: Response,
  next: NextFunction
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
 * Register a new user - supports both traditional and Civic Auth
 */
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("tiktokUsername")
      .notEmpty()
      .withMessage("TikTok username is required"),
    body("password")
      .if(body("authMethod").not().equals("civic")) // Only validate password for traditional auth
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  authController.register
);

/**
 * Login a user - supports both traditional and Civic Auth
 */
router.post(
  "/login",
  [
    body("tiktokUsername")
      .if(body("authMethod").not().equals("civic")) // Only require for traditional login
      .notEmpty()
      .withMessage("TikTok username is required"),
    body("password")
      .if(body("authMethod").not().equals("civic")) // Only require for traditional login
      .notEmpty()
      .withMessage("Password is required"),
    body("walletAddress")
      .if(body("authMethod").equals("civic")) // Only require for Civic Auth login
      .notEmpty()
      .withMessage("Wallet address is required for Civic Auth"),
  ],
  authController.login
);

/**
 * Connect a Civic wallet to an existing account
 */
router.post(
  "/connect-wallet",
  authenticate as express.RequestHandler, // Type assertion to fix TypeScript error
  [body("walletAddress").notEmpty().withMessage("Wallet address is required")],
  authController.connectWallet as express.RequestHandler // Type assertion to fix TypeScript error
);

/**
 * Get current user profile
 */
router.get(
  "/me",
  authenticate as express.RequestHandler, // Type assertion to fix TypeScript error
  authController.getCurrentUser as express.RequestHandler // Type assertion to fix TypeScript error
);

/**
 * Get user by TikTok username
 */
router.get(
  "/tiktok/:tiktokUsername",
  standardizeTiktokUsername as express.RequestHandler, // Type assertion to fix TypeScript error
  [
    param("tiktokUsername")
      .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
      .withMessage("Invalid TikTok username format"),
  ],
  authController.getUserByTiktokUsername
);

/**
 * Update TikTok username
 */
router.patch(
  "/update-tiktok-username",
  authenticate as express.RequestHandler, // Type assertion to fix TypeScript error
  standardizeTiktokUsername as express.RequestHandler, // Type assertion to fix TypeScript error
  [
    body("newTiktokUsername")
      .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
      .withMessage("Invalid TikTok username format"),
  ],
  authController.updateTiktokUsername as express.RequestHandler // Type assertion to fix TypeScript error
);

export default router;
