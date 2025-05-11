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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const authController = __importStar(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Middleware to standardize TikTok usernames (remove @ if present)
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
 * Register a new user - supports both traditional and Civic Auth
 */
router.post("/register", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Please enter a valid email"),
    (0, express_validator_1.body)("tiktokUsername")
        .notEmpty()
        .withMessage("TikTok username is required"),
    (0, express_validator_1.body)("password")
        .if((0, express_validator_1.body)("authMethod").not().equals("civic")) // Only validate password for traditional auth
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long"),
], authController.register);
/**
 * Login a user - supports both traditional and Civic Auth
 */
router.post("/login", [
    (0, express_validator_1.body)("tiktokUsername")
        .if((0, express_validator_1.body)("authMethod").not().equals("civic")) // Only require for traditional login
        .notEmpty()
        .withMessage("TikTok username is required"),
    (0, express_validator_1.body)("password")
        .if((0, express_validator_1.body)("authMethod").not().equals("civic")) // Only require for traditional login
        .notEmpty()
        .withMessage("Password is required"),
    (0, express_validator_1.body)("walletAddress")
        .if((0, express_validator_1.body)("authMethod").equals("civic")) // Only require for Civic Auth login
        .notEmpty()
        .withMessage("Wallet address is required for Civic Auth"),
], authController.login);
/**
 * Connect a Civic wallet to an existing account
 */
router.post("/connect-wallet", auth_middleware_1.authenticate, // Type assertion to fix TypeScript error
[(0, express_validator_1.body)("walletAddress").notEmpty().withMessage("Wallet address is required")], authController.connectWallet // Type assertion to fix TypeScript error
);
/**
 * Get current user profile
 */
router.get("/me", auth_middleware_1.authenticate, // Type assertion to fix TypeScript error
authController.getCurrentUser // Type assertion to fix TypeScript error
);
/**
 * Get user by TikTok username
 */
router.get("/tiktok/:tiktokUsername", standardizeTiktokUsername, // Type assertion to fix TypeScript error
[
    (0, express_validator_1.param)("tiktokUsername")
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid TikTok username format"),
], authController.getUserByTiktokUsername);
/**
 * Update TikTok username
 */
router.patch("/update-tiktok-username", auth_middleware_1.authenticate, // Type assertion to fix TypeScript error
standardizeTiktokUsername, // Type assertion to fix TypeScript error
[
    (0, express_validator_1.body)("newTiktokUsername")
        .matches(/^@?[a-zA-Z0-9_.]{1,24}$/)
        .withMessage("Invalid TikTok username format"),
], authController.updateTiktokUsername // Type assertion to fix TypeScript error
);
exports.default = router;
