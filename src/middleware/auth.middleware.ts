// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Define the user property shape
export interface AuthUser {
  userId: string;
  authMethod?: "traditional" | "civic" | "dual";
}

// Extend Express Request type to include our user property
export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Define JWT payload shape
export interface JwtPayload {
  userId: string;
  authMethod?: "traditional" | "civic" | "dual";
  iat: number;
  exp: number;
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No auth token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as JwtPayload;

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      authMethod: decoded.authMethod,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
    return;
  }
};

/**
 * Role-based middleware to check if user has traditional auth
 * Useful for operations that require password (like password change)
 */
export const requireTraditionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
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
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
    return;
  }
};

/**
 * Middleware to check if user has a connected wallet
 * Useful for operations that require wallet ownership
 */
export const requireWalletAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
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
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
    return;
  }
};
