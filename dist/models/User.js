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
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - phoneNumber
 *         - walletAddress
 *         - privateKey
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           format: password
 *           description: Hashed password
 *         phoneNumber:
 *           type: string
 *           pattern: '^\+?[1-9]\d{1,14}$'
 *           description: International phone number
 *         walletAddress:
 *           type: string
 *           description: Solana wallet public key
 *         privateKey:
 *           type: string
 *           description: Encrypted Solana wallet private key
 *         twitterId:
 *           type: string
 *           description: Twitter user ID
 *         twitterUsername:
 *           type: string
 *           description: Twitter username
 *         twitterVerified:
 *           type: boolean
 *           default: false
 *           description: Whether Twitter account is verified
 *         verificationTweetId:
 *           type: string
 *           description: ID of verification tweet
 *         twitterVerificationCode:
 *           type: string
 *           description: Verification code for Twitter
 *         twitterVerificationExpires:
 *           type: string
 *           format: date-time
 *           description: When verification code expires
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 */
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    walletAddress: {
        type: String,
        required: true,
    },
    privateKey: {
        type: String,
        required: true,
        // Note: In production, this should be encrypted
    },
    tiktokUsername: {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    catch (error) {
        throw new Error(`Password comparison error: ${error.message}`);
    }
};
exports.default = mongoose_1.default.model("User", userSchema);
