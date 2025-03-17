"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByWallet = exports.getUserByTiktokUsername = exports.updateTiktokUsername = exports.login = exports.register = void 0;
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_service_1 = __importDefault(require("../services/user.service"));
const User_1 = __importDefault(require("../models/User"));
const solana_service_1 = __importDefault(require("../services/solana.service"));
const register = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password, tiktokUsername } = req.body;
        // Check if user already exists
        const existingUser = await User_1.default.findOne({
            $or: [{ email }, { tiktokUsername }],
        });
        if (existingUser) {
            return res.status(400).json({
                message: "User with this email or TikTok username already exists",
            });
        }
        // Create Solana wallet
        const { publicKey, privateKey } = await solana_service_1.default.createWallet();
        // Create user
        const user = new User_1.default({
            email,
            password,
            tiktokUsername,
            walletAddress: publicKey,
            privateKey,
        });
        await user.save();
        // Request airdrop if in development environment
        // if (process.env.NODE_ENV !== "production") {
        //   try {
        //     await solanaService.requestAirdrop(publicKey);
        //   } catch (airdropError) {
        //     console.error("Airdrop failed but user was created:", airdropError);
        //   }
        // }
        // Create JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "24h" });
        // Return response (exclude password and private key)
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                email: user.email,
                tiktokUsername: user.tiktokUsername,
                walletAddress: user.walletAddress,
            },
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            message: "Error registering user",
            error: error.message,
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { tiktokUsername, password } = req.body;
        console.log("Login attempt with TikTok username:", tiktokUsername);
        // Find user by TikTok username
        const user = await User_1.default.findOne({ tiktokUsername });
        console.log("User found:", !!user);
        if (!user) {
            return res
                .status(401)
                .json({ message: "Invalid TikTok username or password" });
        }
        // Check password
        const isMatch = await user.comparePassword(password);
        console.log("Password match:", isMatch);
        if (!isMatch) {
            return res
                .status(401)
                .json({ message: "Invalid TikTok username or password" });
        }
        // Create JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "24h" });
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                tiktokUsername: user.tiktokUsername,
                walletAddress: user.walletAddress,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Error during login",
            error: error.message,
        });
    }
};
exports.login = login;
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
