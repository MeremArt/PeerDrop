import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../types";

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
const userSchema = new Schema<IUser>({
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
  // New fields for token account information
  tokenAccountAddress: {
    type: String,
    required: false, // Not required at creation time
  },
  tokenAccountCreated: {
    type: Boolean,
    default: false,
  },
  tokenAccountCreationDate: {
    type: Date,
    required: false,
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
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(`Password comparison error: ${(error as Error).message}`);
  }
};

export default mongoose.model<IUser>("User", userSchema);
