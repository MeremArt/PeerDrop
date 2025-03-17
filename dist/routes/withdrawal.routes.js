"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/withdrawalRoutes.ts
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const transactionController_1 = require("../controllers/transactionController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Withdrawals
 *   description: Token withdrawal endpoints
 */
/**
 * @swagger
 * /api/withdrawals/wallet:
 *   post:
 *     summary: Withdraw tokens to external wallet
 *     description: Transfer tokens from user's custodial wallet to an external wallet
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tiktokUsername
 *               - destinationWallet
 *               - amount
 *             properties:
 *               tiktokUsername:
 *                 type: string
 *                 description: User's TikTok username
 *               destinationWallet:
 *                 type: string
 *                 description: Destination wallet address
 *               amount:
 *                 type: number
 *                 description: Amount to withdraw
 *     responses:
 *       200:
 *         description: Withdrawal completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transactionId:
 *                   type: string
 *                 from:
 *                   type: object
 *                 to:
 *                   type: object
 *                 amount:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Invalid request or insufficient balance
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/wallet", auth_middleware_1.authMiddleware, [
    (0, express_validator_1.body)("tiktokUsername")
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid TikTok username format"),
    (0, express_validator_1.body)("destinationWallet")
        .matches(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
        .withMessage("Invalid Solana wallet address format"),
    (0, express_validator_1.body)("amount")
        .isNumeric()
        .withMessage("Amount must be a number")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be greater than 0"),
], transactionController_1.withdrawToExternalWallet);
/**
 * @swagger
 * /api/withdrawals/bank:
 *   post:
 *     summary: Withdraw tokens to bank account
 *     description: Transfer tokens from user's wallet to their bank account
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tiktokUsername
 *               - bankDetails
 *               - amount
 *             properties:
 *               tiktokUsername:
 *                 type: string
 *                 description: User's TikTok username
 *               bankDetails:
 *                 type: object
 *                 properties:
 *                   accountName:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *                   bankName:
 *                     type: string
 *                   routingNumber:
 *                     type: string
 *               amount:
 *                 type: number
 *                 description: Amount to withdraw
 *     responses:
 *       200:
 *         description: Withdrawal request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reference:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Invalid request or insufficient balance
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/bank", auth_middleware_1.authMiddleware, [
    (0, express_validator_1.body)("tiktokUsername")
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid TikTok username format"),
    (0, express_validator_1.body)("amount")
        .isNumeric()
        .withMessage("Amount must be a number")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be greater than 0"),
    (0, express_validator_1.body)("bankDetails")
        .isObject()
        .withMessage("Bank details must be an object"),
    (0, express_validator_1.body)("bankDetails.accountName")
        .isString()
        .notEmpty()
        .withMessage("Account name is required"),
    (0, express_validator_1.body)("bankDetails.accountNumber")
        .isString()
        .notEmpty()
        .withMessage("Account number is required"),
    (0, express_validator_1.body)("bankDetails.bankName")
        .isString()
        .notEmpty()
        .withMessage("Bank name is required"),
], transactionController_1.withdrawToBank);
exports.default = router;
