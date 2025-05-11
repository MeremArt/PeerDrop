"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
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
 *         tokenAccountAddress:
 *           type: string
 *           description: Solana associated token account address for SONIC
 *         tokenAccountCreated:
 *           type: boolean
 *           default: false
 *           description: Whether the token account has been successfully created
 *         tokenAccountCreationDate:
 *           type: string
 *           format: date-time
 *           description: When the token account was created
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
    // Keep your existing fields
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        // Make password optional for Civic Auth users
        required: function () {
            return this.authMethod === "traditional" || this.authMethod === "dual";
        },
        min: [8, "Password must be at least 8 characters long"],
    },
    tiktokUsername: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    walletAddress: {
        type: String,
        required: true,
        unique: true,
    },
    privateKey: {
        type: String,
        // Private key not required for Civic Auth users
        required: function () {
            return this.authMethod === "traditional";
        },
    },
    // Keep your existing token account fields
    tokenAccountAddress: {
        type: String,
        default: null,
    },
    tokenAccountCreated: {
        type: Boolean,
        default: false,
    },
    tokenAccountCreationDate: {
        type: Date,
        default: null,
    },
    // Add new fields for Civic Auth
    authMethod: {
        type: String,
        enum: ["traditional", "civic", "dual"],
        default: "traditional",
    },
    lastLogin: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
// Your existing password hashing and validation methods
userSchema.pre("save", async function (next) {
    const user = this;
    // Only hash the password if it has been modified or is new, and if it exists
    if ((user.isModified("password") || user.isNew) && user.password) {
        try {
            const salt = await bcryptjs_1.default.genSalt(10);
            user.password = await bcryptjs_1.default.hash(user.password, salt);
        }
        catch (error) {
            return next(error);
        }
    }
    next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        // If no password (Civic Auth user), return false
        if (!this.password) {
            return false;
        }
        return await bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    catch (error) {
        throw error;
    }
};
const User = (0, mongoose_1.model)("User", userSchema);
exports.default = User;
