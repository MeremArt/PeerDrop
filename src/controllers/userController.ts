import { Request, Response } from "express";
import { validationResult } from "express-validator";
import userService from "../services/user.service";
import CheckExistsRequest from "../interfaces/exists.interface";
import { UserRegistrationData } from "../types";
import { AuthRequest } from "../middleware/auth.middleware";
export const registerUser = async (
  req: Request<{}, {}, UserRegistrationData>,
  res: Response
) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, tiktokUsername, password } = req.body;

    if (!tiktokUsername) {
      return res.status(400).json({ message: "TikTok username is required" });
    }

    // Register user and create wallet
    const user = await userService.registerUser({
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
  } catch (error) {
    return res.status(500).json({
      message: "Error registering user",
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

export const checkUserExists = async (
  req: Request<{}, {}, CheckExistsRequest>,
  res: Response
): Promise<Response> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, tiktokUsername, walletAddress } = req.body;

    // Create array to store all existence checks
    const existenceChecks: { field: string; exists: boolean }[] = [];

    // Check each provided field
    if (email) {
      const userByEmail = await userService.findByEmail(email);
      existenceChecks.push({ field: "email", exists: !!userByEmail });
    }

    if (tiktokUsername) {
      const userByTiktok = await userService.findByTiktokUsername(
        tiktokUsername
      );
      existenceChecks.push({ field: "tiktokUsername", exists: !!userByTiktok });
    }

    if (walletAddress) {
      const userByWallet = await userService.findByWallet(walletAddress);
      existenceChecks.push({ field: "walletAddress", exists: !!userByWallet });
    }

    // If no fields were checked, return error
    if (existenceChecks.length === 0) {
      return res.status(400).json({
        message:
          "At least one search parameter (email, tiktokUsername, or walletAddress) is required",
      });
    }

    // Return results
    return res.json({
      exists: existenceChecks.some((check) => check.exists),
      fields: existenceChecks,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error checking user existence",
      error: (error as Error).message,
    });
  }
};

export const deleteUser = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.params;
    const deleted = await userService.deleteUser(userId);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting user",
      error: (error as Error).message,
    });
  }
};

export const updateUser = async (
  req: Request<{ userId: string }, {}, Partial<UserRegistrationData>>,
  res: Response
): Promise<Response> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const updateData = req.body;

    const updatedUser = await userService.updateUser(userId, updateData);

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
  } catch (error) {
    return res.status(500).json({
      message: "Error updating user",
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
    if (existingUser && existingUser._id?.toString() !== userId) {
      return res.status(400).json({
        message: "This TikTok username is already in use",
      });
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
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

export const getUserByEmail = async (
  req: Request<{ email: string }>,
  res: Response
): Promise<Response> => {
  try {
    const { email } = req.params;
    const user = await userService.findByEmail(email);

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
