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
// src/routes/transactionRoutes.ts
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const transactionController = __importStar(require("../controllers/transactionController"));
const router = (0, express_1.Router)();
// Middleware to standardize TikTok usernames (remove @ if present)
const standardizeTiktokUsername = (req, res, next) => {
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
    (0, express_validator_1.body)("fromTiktok")
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid sender TikTok username"),
    (0, express_validator_1.body)("toTiktok")
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid recipient TikTok username")
        .custom((value, { req }) => {
        if (value === req.body.fromTiktok) {
            throw new Error("Sender and recipient cannot be the same");
        }
        return true;
    }),
    (0, express_validator_1.body)("amount")
        .isFloat({ min: 0.000001 })
        .withMessage("Amount must be greater than 0"),
];
// Route for sending SOL
router.post("/send", standardizeTiktokUsername, validateTransaction, transactionController.sendTransaction);
// Route for getting wallet balance
router.get("/balance/:tiktokUsername", standardizeTiktokUsername, [
    (0, express_validator_1.param)("tiktokUsername")
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid TikTok username format"),
], transactionController.getWalletBalance);
exports.default = router;
