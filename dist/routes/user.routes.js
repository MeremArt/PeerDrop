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
// src/routes/userRoutes.ts
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const web3_js_1 = require("@solana/web3.js");
const userController = __importStar(require("../controllers/userController"));
const router = (0, express_1.Router)();
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
// Validation middlewares
const userValidation = {
    email: (0, express_validator_1.body)("email")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
    tiktokUsername: (0, express_validator_1.body)("tiktokUsername")
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid TikTok username format"),
    userId: (0, express_validator_1.param)("userId").isMongoId().withMessage("Invalid user ID format"),
};
// Get user by TikTok username
router.get("/tiktok/:tiktokUsername", standardizeTiktokUsername, [
    (0, express_validator_1.param)("tiktokUsername")
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid TikTok username format"),
], userController.getUserByTiktokUsername);
// Get user by wallet address
router.get("/wallet/:walletAddress", [
    (0, express_validator_1.param)("walletAddress").custom((value) => {
        try {
            new web3_js_1.PublicKey(value);
            return true;
        }
        catch (_a) {
            throw new Error("Invalid Solana wallet address");
        }
    }),
], userController.getUserByWallet);
// Get user by email
router.get("/email/:email", [(0, express_validator_1.param)("email").isEmail().withMessage("Invalid email format")], userController.getUserByEmail);
// Update TikTok username
// router.patch(
//   "/update-tiktok-username",
//   standardizeTiktokUsername,
//   [
//     body("newTiktokUsername")
//       .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
//       .withMessage("Invalid TikTok username format"),
//   ],
//   userController.updateTiktokUsername
// );
// Delete user
router.delete("/:userId", [userValidation.userId], userController.deleteUser);
// Check if user exists (by email, tiktokUsername, or wallet)
router.post("/check-exists", standardizeTiktokUsername, [
    (0, express_validator_1.body)().custom((value) => {
        if (!value.email && !value.tiktokUsername && !value.walletAddress) {
            throw new Error("At least one search parameter is required");
        }
        return true;
    }),
    (0, express_validator_1.body)("email").optional().isEmail().withMessage("Invalid email format"),
    (0, express_validator_1.body)("tiktokUsername")
        .optional()
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid TikTok username format"),
    (0, express_validator_1.body)("walletAddress")
        .optional()
        .custom((value) => {
        try {
            new web3_js_1.PublicKey(value);
            return true;
        }
        catch (_a) {
            throw new Error("Invalid Solana wallet address");
        }
    }),
], userController.checkUserExists);
exports.default = router;
