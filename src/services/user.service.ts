// src/services/userService.ts
import User from "../models/User";
import { Types } from "mongoose";
import { IUser } from "../types";
import solanaService from "./solana.service";
import { PublicKey } from "@solana/web3.js";

// Define UserRegistrationData interface
export interface UserRegistrationData {
  email: string;
  tiktokUsername: string;
  password?: string;
  walletAddress?: string;
  authMethod?: "traditional" | "civic" | "dual";
}

class UserService {
  /**
   * Validates a Solana wallet address
   */
  private validateSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if a user exists with given email or tiktokUsername
   */
  private async checkExistingUser(
    data: Partial<UserRegistrationData>
  ): Promise<boolean> {
    const query: any[] = [];

    if (data.email) query.push({ email: data.email });
    if (data.tiktokUsername)
      query.push({ tiktokUsername: data.tiktokUsername });

    if (query.length === 0) return false;

    const existingUser = await User.findOne({ $or: query });
    return !!existingUser;
  }

  /**
   * Register a new user
   */
  async registerUser(userData: UserRegistrationData): Promise<IUser> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email },
          { tiktokUsername: userData.tiktokUsername },
        ],
      });
      if (existingUser) {
        throw new Error(
          "User with this email or TikTok username already exists"
        );
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
      } else {
        // Create new Solana wallet for traditional users
        const walletInfo = await solanaService.createWallet();
        publicKey = walletInfo.publicKey;
        privateKey = walletInfo.privateKey;
      }

      // Create new user with wallet information
      const user = new User({
        email: userData.email,
        tiktokUsername: userData.tiktokUsername,
        password: userData.password, // Will be hashed in the model's pre-save hook
        walletAddress: publicKey,
        privateKey: privateKey,
        authMethod: userData.authMethod || "traditional",
      });

      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Failed to register user: ${(error as Error).message}`);
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID format");
    }
    return User.findById(id);
  }

  /**
   * Find user by TikTok username
   */
  async findByTiktokUsername(tiktokUsername: string): Promise<IUser | null> {
    return User.findOne({ tiktokUsername });
  }

  /**
   * Find user by wallet address
   */
  async findByWallet(walletAddress: string): Promise<IUser | null> {
    // Validate wallet address first
    if (!this.validateSolanaAddress(walletAddress)) {
      throw new Error("Invalid Solana wallet address");
    }
    return User.findOne({ walletAddress });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  /**
   * Update user information
   */
  async updateUser(
    userId: string,
    updateData: Partial<UserRegistrationData>
  ): Promise<IUser | null> {
    // Validate userId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }

    // Check if wallet address is being updated
    if (
      updateData.walletAddress &&
      !this.validateSolanaAddress(updateData.walletAddress)
    ) {
      throw new Error("Invalid Solana wallet address");
    }

    // Check if updated email or tiktokUsername is already in use by ANOTHER user
    if (updateData.email || updateData.tiktokUsername) {
      const query: any[] = [];

      if (updateData.email) query.push({ email: updateData.email });
      if (updateData.tiktokUsername)
        query.push({ tiktokUsername: updateData.tiktokUsername });

      if (query.length > 0) {
        const existingUser = await User.findOne({
          _id: { $ne: userId }, // Exclude the current user
          $or: query,
        });

        if (existingUser) {
          throw new Error(
            "Email or TikTok username already in use by another user"
          );
        }
      }
    }

    return User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  /**
   * Update a user's TikTok username
   * @param userId ID of the user to update
   * @param newTiktokUsername New TikTok username (with or without @ symbol)
   */
  async updateTiktokUsername(
    userId: string,
    newTiktokUsername: string
  ): Promise<IUser | null> {
    try {
      // Validate userId format
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID format");
      }

      // Remove @ if present
      const formattedUsername = newTiktokUsername.replace(/^@/, "");

      // Check if username is already taken by another user
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        tiktokUsername: formattedUsername,
      });

      if (existingUser) {
        throw new Error(
          "This TikTok username is already in use by another user"
        );
      }

      // Update the user's TikTok username
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { tiktokUsername: formattedUsername } },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        throw new Error("User not found");
      }

      return updatedUser;
    } catch (error) {
      throw new Error(
        `Failed to update TikTok username: ${(error as Error).message}`
      );
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<boolean> {
    // Validate userId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }

    const result = await User.findByIdAndDelete(userId);
    return !!result;
  }

  /**
   * List users with pagination
   */
  async listUsers(limit: number = 10, skip: number = 0): Promise<IUser[]> {
    return User.find()
      .select("-password -privateKey") // Exclude sensitive data
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });
  }

  /**
   * Count total users
   */
  async countUsers(): Promise<number> {
    return User.countDocuments();
  }

  /**
   * Connect a wallet to an existing user (for Civic Auth)
   */
  async connectWallet(
    userId: string,
    walletAddress: string
  ): Promise<IUser | null> {
    try {
      // Validate userId format
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID format");
      }

      // Validate the wallet address
      if (!this.validateSolanaAddress(walletAddress)) {
        throw new Error("Invalid Solana wallet address");
      }

      // Check if wallet is already connected to another account
      const existingWalletUser = await User.findOne({ walletAddress });
      if (existingWalletUser && existingWalletUser._id.toString() !== userId) {
        throw new Error(
          "This wallet address is already connected to another account"
        );
      }

      // Find the user
      const user = await User.findById(userId);
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
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${(error as Error).message}`);
    }
  }
}

export default new UserService();
