"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireWalletAccess = exports.requireTraditionalAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
const authenticate = (req, res, next) => {
    try {
        // Get the token from the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "No auth token provided" });
            return;
        }
        const token = authHeader.split(" ")[1];
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-secret-key");
        // Add user info to request
        req.user = {
            userId: decoded.userId,
            authMethod: decoded.authMethod,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ message: "Invalid or expired token" });
            return;
        }
        console.error("Auth middleware error:", error);
        res.status(500).json({ message: "Authentication error" });
        return;
    }
};
exports.authenticate = authenticate;
/**
 * Role-based middleware to check if user has traditional auth
 * Useful for operations that require password (like password change)
 */
const requireTraditionalAuth = (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }
        const { authMethod } = req.user;
        if (authMethod !== "traditional" && authMethod !== "dual") {
            res.status(403).json({
                message: "This operation requires traditional authentication",
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({ message: "Authentication error" });
        return;
    }
};
exports.requireTraditionalAuth = requireTraditionalAuth;
/**
 * Middleware to check if user has a connected wallet
 * Useful for operations that require wallet ownership
 */
const requireWalletAccess = (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }
        const { authMethod } = req.user;
        if (authMethod !== "civic" && authMethod !== "dual") {
            res.status(403).json({
                message: "This operation requires wallet authentication",
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({ message: "Authentication error" });
        return;
    }
};
exports.requireWalletAccess = requireWalletAccess;
