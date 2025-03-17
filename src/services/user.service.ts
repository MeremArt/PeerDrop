// src/services/userService.ts
import User from "../models/User";
import { IUser, UserRegistrationData } from "../types";
import solanaService from "./solana.service";
import { PublicKey } from "@solana/web3.js";

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
   * Checks if a user exists with given email, phone, or twitter ID
   */
  private async checkExistingUser(
    data: Partial<UserRegistrationData>
  ): Promise<boolean> {
    const query: any[] = [];

    if (data.email) query.push({ email: data.email });
    if (data.tiktokUsername)
      query.push({ tiktokUsername: data.tiktokUsername }); // Changed from phoneNumber

    if (query.length === 0) return false;

    const existingUser = await User.findOne({ $or: query });
    return !!existingUser;
  }

  /**
   * Register a new user
   */
  async registerUser(userData: UserRegistrationData) {
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
          "User with this email, TikTok username, or Twitter ID already exists"
        );
      }
      // Create new Solana wallet
      const { publicKey, privateKey } = await solanaService.createWallet();

      // Create new user with generated wallet
      const user = new User({
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
    } catch (error) {
      throw new Error(`Failed to register user: ${(error as Error).message}`);
    }
  }

  /**
   * Find user by phone number
   */
  async findByTiktokUsername(tiktokUsername: string): Promise<IUser | null> {
    return User.findOne({ tiktokUsername });
  }

  /**
   * Find user by wallet address
   */
  async findByWallet(walletAddress: string): Promise<IUser | null> {
    return User.findOne({ walletAddress });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
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
  async updateUser(
    userId: string,
    updateData: Partial<UserRegistrationData>
  ): Promise<IUser | null> {
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
    const result = await User.findByIdAndDelete(userId);
    return !!result;
  }
}

export default new UserService();
