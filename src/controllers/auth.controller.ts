import { Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import userService from "../services/user.service";
import { AuthRequest } from "../middleware/auth.middleware";
import User from "../models/User";
import solanaService from "../services/solana.service";

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, tiktokUsername } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { tiktokUsername }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or TikTok username already exists",
      });
    }

    // Create Solana wallet
    const {
      publicKey,
      privateKey,
      tokenAccount,
      tokenAccountCreated,
      tokenAccountTxSignature,
    } = await solanaService.createWallet();

    // Create user
    const user = new User({
      email,
      password,
      tiktokUsername,
      walletAddress: publicKey,
      privateKey,
      tokenAccountAddress: tokenAccount,
      tokenAccountCreated: tokenAccountCreated,
      tokenAccountCreationDate: tokenAccountCreated ? new Date() : undefined,
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
    const token = jwt.sign(
      { userId: user._id },
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

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tiktokUsername, password } = req.body;

    console.log("Login attempt with TikTok username:", tiktokUsername);

    // Find user by TikTok username
    const user = await User.findOne({ tiktokUsername });

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
    const token = jwt.sign(
      { userId: user._id },
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

export const updateTiktokUsername = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.userId; // From auth middleware
    const { newTiktokUsername } = req.body;

    // Remove @ symbol if present
    const formattedUsername = newTiktokUsername.replace(/^@/, "");

    // Check if username already taken
    const existingUser = await userService.findByTiktokUsername(
      formattedUsername
    );
    if (
      existingUser &&
      typeof existingUser._id === "string" &&
      existingUser._id.toString() !== userId
    ) {
      return res.status(400).json({
        message: "This TikTok username is already in use",
      });
    }

    const updatedUser = await userService.updateUser(userId, {
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
  } catch (error) {
    return res.status(500).json({
      message: "Error updating TikTok username",
      error: (error as Error).message,
    });
  }
};

export const getUserByTiktokUsername = async (
  req: Request<{ tiktokUsername: string }>,
  res: Response
): Promise<Response> => {
  try {
    const { tiktokUsername } = req.params;
    const user = await userService.findByTiktokUsername(tiktokUsername);

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
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching user",
      error: (error as Error).message,
    });
  }
};

export const getUserByWallet = async (
  req: Request<{ walletAddress: string }>,
  res: Response
): Promise<Response> => {
  try {
    const { walletAddress } = req.params;
    const user = await userService.findByWallet(walletAddress);

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
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching user",
      error: (error as Error).message,
    });
  }
};
