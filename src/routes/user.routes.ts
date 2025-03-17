// src/routes/userRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { PublicKey } from "@solana/web3.js";
import * as userController from "../controllers/userController";

const router = Router();

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

// Validation middlewares
const userValidation = {
  email: body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  tiktokUsername: body("tiktokUsername")
    .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
    .withMessage("Invalid TikTok username format"),

  userId: param("userId").isMongoId().withMessage("Invalid user ID format"),
};

// Get user by TikTok username
router.get(
  "/tiktok/:tiktokUsername",
  standardizeTiktokUsername,
  [
    param("tiktokUsername")
      .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
      .withMessage("Invalid TikTok username format"),
  ],
  userController.getUserByTiktokUsername
);

// Get user by wallet address
router.get(
  "/wallet/:walletAddress",
  [
    param("walletAddress").custom((value) => {
      try {
        new PublicKey(value);
        return true;
      } catch {
        throw new Error("Invalid Solana wallet address");
      }
    }),
  ],
  userController.getUserByWallet
);

// Get user by email
router.get(
  "/email/:email",
  [param("email").isEmail().withMessage("Invalid email format")],
  userController.getUserByEmail
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
  userController.updateTiktokUsername
);

// Delete user
router.delete("/:userId", [userValidation.userId], userController.deleteUser);

// Check if user exists (by email, tiktokUsername, or wallet)
router.post(
  "/check-exists",
  standardizeTiktokUsername,
  [
    body().custom((value) => {
      if (!value.email && !value.tiktokUsername && !value.walletAddress) {
        throw new Error("At least one search parameter is required");
      }
      return true;
    }),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("tiktokUsername")
      .optional()
      .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
      .withMessage("Invalid TikTok username format"),
    body("walletAddress")
      .optional()
      .custom((value) => {
        try {
          new PublicKey(value);
          return true;
        } catch {
          throw new Error("Invalid Solana wallet address");
        }
      }),
  ],
  userController.checkUserExists
);

export default router;
