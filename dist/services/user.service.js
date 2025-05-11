"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/userService.ts
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = require("mongoose");
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
     * Checks if a user exists with given email or tiktokUsername
     */
    async checkExistingUser(data) {
        const query = [];
        if (data.email)
            query.push({ email: data.email });
        if (data.tiktokUsername)
            query.push({ tiktokUsername: data.tiktokUsername });
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
                throw new Error("User with this email or TikTok username already exists");
            }
            let publicKey, privateKey;
            // If Civic Auth is being used and wallet address is provided
            if (userData.authMethod === "civic" && userData.walletAddress) {
                // Validate the provided wallet address
                if (!this.validateSolanaAddress(userData.walletAddress)) {
                    throw new Error("Invalid Solana wallet address");
                }
                publicKey = userData.walletAddress;
                privateKey = null; // Civic Auth users manage their own private keys
            }
            else {
                // Create new Solana wallet for traditional users
                const walletInfo = await solana_service_1.default.createWallet();
                publicKey = walletInfo.publicKey;
                privateKey = walletInfo.privateKey;
            }
            // Create new user with wallet information
            const user = new User_1.default({
                email: userData.email,
                tiktokUsername: userData.tiktokUsername,
                password: userData.password, // Will be hashed in the model's pre-save hook
                walletAddress: publicKey,
                privateKey: privateKey,
                authMethod: userData.authMethod || "traditional",
            });
            await user.save();
            return user;
        }
        catch (error) {
            throw new Error(`Failed to register user: ${error.message}`);
        }
    }
    /**
     * Find user by ID
     */
    async findById(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new Error("Invalid user ID format");
        }
        return User_1.default.findById(id);
    }
    /**
     * Find user by TikTok username
     */
    async findByTiktokUsername(tiktokUsername) {
        return User_1.default.findOne({ tiktokUsername });
    }
    /**
     * Find user by wallet address
     */
    async findByWallet(walletAddress) {
        // Validate wallet address first
        if (!this.validateSolanaAddress(walletAddress)) {
            throw new Error("Invalid Solana wallet address");
        }
        return User_1.default.findOne({ walletAddress });
    }
    /**
     * Find user by email
     */
    async findByEmail(email) {
        return User_1.default.findOne({ email });
    }
    /**
     * Update user information
     */
    async updateUser(userId, updateData) {
        // Validate userId format
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID format");
        }
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
            // Validate userId format
            if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                throw new Error("Invalid user ID format");
            }
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
        // Validate userId format
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID format");
        }
        const result = await User_1.default.findByIdAndDelete(userId);
        return !!result;
    }
    /**
     * List users with pagination
     */
    async listUsers(limit = 10, skip = 0) {
        return User_1.default.find()
            .select("-password -privateKey") // Exclude sensitive data
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 });
    }
    /**
     * Count total users
     */
    async countUsers() {
        return User_1.default.countDocuments();
    }
    /**
     * Connect a wallet to an existing user (for Civic Auth)
     */
    async connectWallet(userId, walletAddress) {
        try {
            // Validate userId format
            if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                throw new Error("Invalid user ID format");
            }
            // Validate the wallet address
            if (!this.validateSolanaAddress(walletAddress)) {
                throw new Error("Invalid Solana wallet address");
            }
            // Check if wallet is already connected to another account
            const existingWalletUser = await User_1.default.findOne({ walletAddress });
            if (existingWalletUser && existingWalletUser._id.toString() !== userId) {
                throw new Error("This wallet address is already connected to another account");
            }
            // Find the user
            const user = await User_1.default.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            // Update the user
            user.walletAddress = walletAddress;
            // Update auth method if needed
            if (user.authMethod === "traditional") {
                user.authMethod = "dual";
            }
            await user.save();
            return user;
        }
        catch (error) {
            throw new Error(`Failed to connect wallet: ${error.message}`);
        }
    }
}
exports.default = new UserService();
