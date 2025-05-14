// src/routes/transactionRoutes.ts
import { Router, Request, Response, NextFunction } from "express";
import { body, param } from "express-validator";
import * as transactionController from "../controllers/transactionController";

const router = Router();

// Middleware to standardize TikTok usernames (remove @ if present)
const standardizeTiktokUsername = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body.fromTiktok) {
    req.body.fromTiktok = req.body.fromTiktok.replace(/^@/, "");
  }
  if (req.body.toTiktok) {
    req.body.toTiktok = req.body.toTiktok.replace(/^@/, "");
  }
  if (req.params.tiktokUsername) {
    req.params.tiktokUsername = req.params.tiktokUsername.replace(/^@/, "");
  }
  next();
};

// Validation middleware for transaction
const validateTransaction = [
  body("fromTiktok")
    .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
    .withMessage("Invalid sender TikTok username"),

  body("toTiktok")
    .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
    .withMessage("Invalid recipient TikTok username")
    .custom((value, { req }) => {
      if (value === req.body.fromTiktok) {
        throw new Error("Sender and recipient cannot be the same");
      }
      return true;
    }),

  body("amount")
    .isFloat({ min: 0.000001 })
    .withMessage("Amount must be greater than 0"),
];

// Route for sending SOL
router.post(
  "/send",
  standardizeTiktokUsername,
  validateTransaction,
  transactionController.sendTransaction
);

// Route for getting wallet balance
router.get(
  "/balance/:tiktokUsername",
  standardizeTiktokUsername,
  [
    param("tiktokUsername")
      .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
      .withMessage("Invalid TikTok username format"),
  ],
  transactionController.getWalletBalance
);
router.get(
  "/wallets/balance/:walletAddress",
  transactionController.getAuthBalance
);

export default router;
