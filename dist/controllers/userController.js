"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByEmail = exports.getUserByWallet = exports.updateTiktokUsername = exports.updateUser = exports.deleteUser = exports.checkUserExists = exports.getUserByTiktokUsername = exports.registerUser = void 0;
const express_validator_1 = require("express-validator");
const user_service_1 = __importDefault(require("../services/user.service"));
const registerUser = async (req, res) => {
    try {
        // Validate request
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, tiktokUsername, password } = req.body;
        // Register user and create wallet
        const user = await user_service_1.default.registerUser({
            email,
            tiktokUsername,
            password,
        });
        // Return response (exclude private key from response)
        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                email: user.email,
                tiktokUsername: user.tiktokUsername,
                walletAddress: user.walletAddress,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error registering user",
            error: error.message,
        });
    }
};
exports.registerUser = registerUser;
const getUserByTiktokUsername = async (req, res) => {
    try {
        const { tiktokUsername } = req.params;
        const user = await user_service_1.default.findByTiktokUsername(tiktokUsername);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json({
            user: {
                id: user._id,
                email: user.email,
                tiktokUsername: user.tiktokUsername,
                walletAddress: user.walletAddress,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error fetching user",
            error: error.message,
        });
    }
};
exports.getUserByTiktokUsername = getUserByTiktokUsername;
const checkUserExists = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, tiktokUsername, walletAddress } = req.body;
        // Create array to store all existence checks
        const existenceChecks = [];
        // Check each provided field
        if (email) {
            const userByEmail = await user_service_1.default.findByEmail(email);
            existenceChecks.push({ field: "email", exists: !!userByEmail });
        }
        if (tiktokUsername) {
            const userByTiktok = await user_service_1.default.findByTiktokUsername(tiktokUsername);
            existenceChecks.push({ field: "tiktokUsername", exists: !!userByTiktok });
        }
        if (walletAddress) {
            const userByWallet = await user_service_1.default.findByWallet(walletAddress);
            existenceChecks.push({ field: "walletAddress", exists: !!userByWallet });
        }
        // If no fields were checked, return error
        if (existenceChecks.length === 0) {
            return res.status(400).json({
                message: "At least one search parameter (email, tiktokUsername, or walletAddress) is required",
            });
        }
        // Return results
        return res.json({
            exists: existenceChecks.some((check) => check.exists),
            fields: existenceChecks,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error checking user existence",
            error: error.message,
        });
    }
};
exports.checkUserExists = checkUserExists;
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const deleted = await user_service_1.default.deleteUser(userId);
        if (!deleted) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json({
            message: "User deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error deleting user",
            error: error.message,
        });
    }
};
exports.deleteUser = deleteUser;
const updateUser = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { userId } = req.params;
        const updateData = req.body;
        const updatedUser = await user_service_1.default.updateUser(userId, updateData);
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json({
            message: "User updated successfully",
            user: {
                id: updatedUser._id,
                email: updatedUser.email,
                tiktokUsername: updatedUser.tiktokUsername,
                walletAddress: updatedUser.walletAddress,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error updating user",
            error: error.message,
        });
    }
};
exports.updateUser = updateUser;
const updateTiktokUsername = async (req, res) => {
    var _a;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // From auth middleware
        const { newTiktokUsername } = req.body;
        // Remove @ symbol if present
        const formattedUsername = newTiktokUsername.replace(/^@/, "");
        // Check if username already taken
        const existingUser = await user_service_1.default.findByTiktokUsername(formattedUsername);
        if (existingUser &&
            typeof existingUser._id === "string" &&
            existingUser._id.toString() !== userId) {
            return res.status(400).json({
                message: "This TikTok username is already in use",
            });
        }
        const updatedUser = await user_service_1.default.updateUser(userId, {
            tiktokUsername: formattedUsername,
        });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json({
            message: "TikTok username updated successfully",
            user: {
                id: updatedUser._id,
                email: updatedUser.email,
                tiktokUsername: updatedUser.tiktokUsername,
                walletAddress: updatedUser.walletAddress,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error updating TikTok username",
            error: error.message,
        });
    }
};
exports.updateTiktokUsername = updateTiktokUsername;
const getUserByWallet = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const user = await user_service_1.default.findByWallet(walletAddress);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json({
            user: {
                id: user._id,
                email: user.email,
                tiktokUsername: user.tiktokUsername,
                walletAddress: user.walletAddress,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error fetching user",
            error: error.message,
        });
    }
};
exports.getUserByWallet = getUserByWallet;
const getUserByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await user_service_1.default.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json({
            user: {
                id: user._id,
                email: user.email,
                tiktokUsername: user.tiktokUsername,
                walletAddress: user.walletAddress,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error fetching user",
            error: error.message,
        });
    }
};
exports.getUserByEmail = getUserByEmail;
