"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/userService.ts
const User_1 = __importDefault(require("../models/User"));
const solana_service_1 = __importDefault(require("./solana.service"));
const web3_js_1 = require("@solana/web3.js");
class UserService {
    /**
     * Validates a Solana wallet address
     */
    validateSolanaAddress(address) {
        try {
            new web3_js_1.PublicKey(address);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    /**
     * Checks if a user exists with given email, phone, or twitter ID
     */
    async checkExistingUser(data) {
        const query = [];
        if (data.email)
            query.push({ email: data.email });
        if (data.tiktokUsername)
            query.push({ tiktokUsername: data.tiktokUsername }); // Changed from phoneNumber
        if (query.length === 0)
            return false;
        const existingUser = await User_1.default.findOne({ $or: query });
        return !!existingUser;
    }
    /**
     * Register a new user
     */
    async registerUser(userData) {
        try {
            // Check if user already exists
            const existingUser = await User_1.default.findOne({
                $or: [
                    { email: userData.email },
                    { tiktokUsername: userData.tiktokUsername },
                ],
            });
            if (existingUser) {
                throw new Error("User with this email, TikTok username, or Twitter ID already exists");
            }
            // Create new Solana wallet
            const { publicKey, privateKey } = await solana_service_1.default.createWallet();
            // Create new user with generated wallet
            const user = new User_1.default({
                email: userData.email,
                tiktokUsername: userData.tiktokUsername,
                walletAddress: publicKey,
                privateKey: privateKey,
            });
            await user.save();
            // if (process.env.NODE_ENV !== "production") {
            //   try {
            //     await solanaService.requestAirdrop(publicKey);
            //   } catch (airdropError) {
            //     console.error("Airdrop failed but user was created:", airdropError);
            //   }
            // }
            return user;
        }
        catch (error) {
            throw new Error(`Failed to register user: ${error.message}`);
        }
    }
    /**
     * Find user by phone number
     */
    async findByTiktokUsername(tiktokUsername) {
        return User_1.default.findOne({ tiktokUsername });
    }
    /**
     * Find user by wallet address
     */
    async findByWallet(walletAddress) {
        return User_1.default.findOne({ walletAddress });
    }
    /**
     * Find user by email
     */
    async findByEmail(email) {
        return User_1.default.findOne({ email });
    }
    /**
     * Find user by Twitter ID
     */
    // async findByTwitterId(twitterId: string): Promise<IUser | null> {
    //   return User.findOne({ twitterId });
    // }
    /**
     * Update user information
     */
    async updateUser(userId, updateData) {
        // Check if wallet address is being updated
        if (updateData.walletAddress &&
            !this.validateSolanaAddress(updateData.walletAddress)) {
            throw new Error("Invalid Solana wallet address");
        }
        // Check if updated email or tiktokUsername is already in use by ANOTHER user
        if (updateData.email || updateData.tiktokUsername) {
            const query = [];
            if (updateData.email)
                query.push({ email: updateData.email });
            if (updateData.tiktokUsername)
                query.push({ tiktokUsername: updateData.tiktokUsername });
            if (query.length > 0) {
                const existingUser = await User_1.default.findOne({
                    _id: { $ne: userId }, // Exclude the current user
                    $or: query,
                });
                if (existingUser) {
                    throw new Error("Email or TikTok username already in use by another user");
                }
            }
        }
        return User_1.default.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true });
    }
    /**
     * Update a user's TikTok username
     * @param userId ID of the user to update
     * @param newTiktokUsername New TikTok username (with or without @ symbol)
     */
    async updateTiktokUsername(userId, newTiktokUsername) {
        try {
            // Remove @ if present
            const formattedUsername = newTiktokUsername.replace(/^@/, "");
            // Check if username is already taken by another user
            const existingUser = await User_1.default.findOne({
                _id: { $ne: userId },
                tiktokUsername: formattedUsername,
            });
            if (existingUser) {
                throw new Error("This TikTok username is already in use by another user");
            }
            // Update the user's TikTok username
            const updatedUser = await User_1.default.findByIdAndUpdate(userId, { $set: { tiktokUsername: formattedUsername } }, { new: true, runValidators: true });
            if (!updatedUser) {
                throw new Error("User not found");
            }
            return updatedUser;
        }
        catch (error) {
            throw new Error(`Failed to update TikTok username: ${error.message}`);
        }
    }
    /**
     * Delete user
     */
    async deleteUser(userId) {
        const result = await User_1.default.findByIdAndDelete(userId);
        return !!result;
    }
}
exports.default = new UserService();
