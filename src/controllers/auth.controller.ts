// controllers/auth.controller.ts
import { Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import userService from "../services/user.service";
import { AuthRequest } from "../middleware/auth.middleware";
import User from "../models/User";
import solanaService from "../services/solana.service";

/**
 * Register a new user with either traditional or Civic Auth
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, tiktokUsername, authMethod, walletAddress } =
      req.body;

    // Validate input based on auth method
    if (authMethod !== "civic" && !password) {
      res.status(400).json({
        message: "Password is required for traditional authentication",
      });
      return;
    }

    if (!email || !tiktokUsername) {
      res.status(400).json({
        message: "Email and TikTok username are required",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { tiktokUsername }],
    });

    if (existingUser) {
      res.status(400).json({
        message: "User with this email or TikTok username already exists",
      });
      return;
    }

    let publicKey,
      privateKey,
      tokenAccount,
      tokenAccountCreated,
      tokenAccountTxSignature;

    // For Civic Auth, use the provided wallet address
    if (authMethod === "civic" && walletAddress) {
      publicKey = walletAddress;
      // For Civic Auth users, we don't manage their private key
      privateKey = null;

      // Create token account for the external wallet
      try {
        const tokenAccountInfo =
          await solanaService.createTokenAccountForExternalWallet(
            walletAddress
          );
        tokenAccount = tokenAccountInfo.tokenAccount;
        tokenAccountCreated = tokenAccountInfo.tokenAccountCreated;
        tokenAccountTxSignature = tokenAccountInfo.tokenAccountTxSignature;
      } catch (tokenAccountError) {
        console.error(
          "Error creating token account for Civic wallet:",
          tokenAccountError
        );
        // Continue with registration even if token account creation fails
        tokenAccount = null;
        tokenAccountCreated = false;
      }
    } else {
      // For traditional auth, create a new Solana wallet
      const walletInfo = await solanaService.createWallet();
      publicKey = walletInfo.publicKey;
      privateKey = walletInfo.privateKey;
      tokenAccount = walletInfo.tokenAccount;
      tokenAccountCreated = walletInfo.tokenAccountCreated;
      tokenAccountTxSignature = walletInfo.tokenAccountTxSignature;
    }

    // Create user with auth method
    const user = new User({
      email,
      password, // Will only be set for traditional auth
      tiktokUsername,
      walletAddress: publicKey,
      privateKey, // Will be null for Civic Auth users
      tokenAccountAddress: tokenAccount,
      tokenAccountCreated: tokenAccountCreated,
      tokenAccountCreationDate: tokenAccountCreated ? new Date() : undefined,
      authMethod: authMethod || "traditional",
    });

    await user.save();

    // Create JWT token with auth method information
    const token = jwt.sign(
      {
        userId: user._id,
        authMethod: user.authMethod,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Return response (exclude password and private key)
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        tiktokUsername: user.tiktokUsername,
        walletAddress: user.walletAddress,
        tokenAccountAddress: user.tokenAccountAddress,
        tokenAccountCreated: user.tokenAccountCreated,
        authMethod: user.authMethod,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Error registering user",
      error: (error as Error).message,
    });
  }
};

/**
 * Login a user with either traditional or Civic Auth
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { tiktokUsername, password, authMethod, walletAddress } = req.body;
    let user = null;

    // Handle Civic Auth login
    if (authMethod === "civic") {
      if (!walletAddress) {
        res
          .status(400)
          .json({ message: "Wallet address is required for Civic Auth" });
        return;
      }

      console.log("Civic Auth login attempt with wallet:", walletAddress);

      // Find user by wallet address
      user = await User.findOne({ walletAddress });

      if (!user) {
        res.status(401).json({
          message:
            "No account found with this wallet address. Please register first.",
        });
        return;
      }

      console.log("Civic Auth user found:", !!user);
    }
    // Handle traditional login
    else {
      if (!tiktokUsername || !password) {
        res
          .status(400)
          .json({ message: "TikTok username and password are required" });
        return;
      }

      console.log("Login attempt with TikTok username:", tiktokUsername);

      // Find user by TikTok username
      user = await User.findOne({ tiktokUsername });

      console.log("User found:", !!user);

      if (!user) {
        res
          .status(401)
          .json({ message: "Invalid TikTok username or password" });
        return;
      }

      // Check password for traditional auth
      const isMatch = await user.comparePassword(password);
      console.log("Password match:", isMatch);

      if (!isMatch) {
        res
          .status(401)
          .json({ message: "Invalid TikTok username or password" });
        return;
      }
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Create JWT token with auth method information
    const token = jwt.sign(
      {
        userId: user._id,
        authMethod: user.authMethod,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        tiktokUsername: user.tiktokUsername,
        walletAddress: user.walletAddress,
        authMethod: user.authMethod,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Error during login",
      error: (error as Error).message,
    });
  }
};

/**
 * Connect a Civic wallet to an existing account
 */
export const connectWallet = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { walletAddress } = req.body;

    if (!walletAddress) {
      res.status(400).json({ message: "Wallet address is required" });
      return;
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if wallet is already connected to another account
    const existingWalletUser = await User.findOne({ walletAddress });

    // Fixed: Properly handle the MongoDB document ID comparison
    if (
      existingWalletUser &&
      existingWalletUser._id &&
      existingWalletUser._id.toString() !== userId
    ) {
      res.status(400).json({
        message: "This wallet is already connected to another account",
      });
      return;
    }

    // Update user
    user.walletAddress = walletAddress;

    // If user was traditional auth, update to support both
    if (user.authMethod === "traditional") {
      user.authMethod = "dual";
    }

    await user.save();

    // Create new token with updated auth method
    const token = jwt.sign(
      {
        userId: user._id,
        authMethod: user.authMethod,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Wallet connected successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        tiktokUsername: user.tiktokUsername,
        walletAddress: user.walletAddress,
        authMethod: user.authMethod,
      },
    });
  } catch (error) {
    console.error("Connect wallet error:", error);
    res.status(500).json({
      message: "Error connecting wallet",
      error: (error as Error).message,
    });
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const user = await User.findById(userId).select("-password -privateKey");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        tiktokUsername: user.tiktokUsername,
        walletAddress: user.walletAddress,
        tokenAccountAddress: user.tokenAccountAddress,
        tokenAccountCreated: user.tokenAccountCreated,
        authMethod: user.authMethod,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      message: "Error fetching user profile",
      error: (error as Error).message,
    });
  }
};

/**
 * Update TikTok username
 */
export const updateTiktokUsername = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { newTiktokUsername } = req.body;

    // Check if username already taken
    const existingUser = await userService.findByTiktokUsername(
      newTiktokUsername
    );

    // Fixed: Properly handle the MongoDB document ID comparison
    if (
      existingUser &&
      existingUser._id &&
      existingUser._id.toString() !== userId
    ) {
      res.status(400).json({
        message: "This TikTok username is already in use",
      });
      return;
    }

    const updatedUser = await userService.updateUser(userId, {
      tiktokUsername: newTiktokUsername,
    });

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      message: "TikTok username updated successfully",
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        tiktokUsername: updatedUser.tiktokUsername,
        walletAddress: updatedUser.walletAddress,
        authMethod: updatedUser.authMethod,
      },
    });
  } catch (error) {
    console.error("Update TikTok username error:", error);
    res.status(500).json({
      message: "Error updating TikTok username",
      error: (error as Error).message,
    });
  }
};

/**
 * Get user by TikTok username
 */
export const getUserByTiktokUsername = async (
  req: Request<{ tiktokUsername: string }>,
  res: Response
): Promise<void> => {
  try {
    const { tiktokUsername } = req.params;
    const user = await userService.findByTiktokUsername(tiktokUsername);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        tiktokUsername: user.tiktokUsername,
        walletAddress: user.walletAddress,
        authMethod: user.authMethod,
      },
    });
  } catch (error) {
    console.error("Get user by TikTok username error:", error);
    res.status(500).json({
      message: "Error fetching user",
      error: (error as Error).message,
    });
  }
};

/**
 * Get user by wallet address
 */
export const getUserByWallet = async (
  req: Request<{ walletAddress: string }>,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.params;
    const user = await userService.findByWallet(walletAddress);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        tiktokUsername: user.tiktokUsername,
        walletAddress: user.walletAddress,
        authMethod: user.authMethod,
      },
    });
  } catch (error) {
    console.error("Get user by wallet error:", error);
    res.status(500).json({
      message: "Error fetching user",
      error: (error as Error).message,
    });
  }
};
