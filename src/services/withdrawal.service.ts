import mongoose from "mongoose";
import Withdrawal from "../models/Withdrawal";
import {
  WithdrawalData,
  WithdrawalQueryOptions,
  WithdrawalStats,
} from "../interfaces/withdrawdata.interface";

import { IWithdrawal, WithdrawalStatus, WithdrawalMethod } from "../types";

class WithdrawalService {
  /**
   * Create a new withdrawal record
   */
  async createWithdrawal(withdrawalData: WithdrawalData): Promise<IWithdrawal> {
    try {
      const withdrawal = new Withdrawal({
        userId: withdrawalData.userId,
        amount: withdrawalData.amount,
        destinationWallet: withdrawalData.destinationWallet,
        bankDetails: withdrawalData.bankDetails,
        reference: withdrawalData.reference,
        transactionId: withdrawalData.transactionId,
        method: withdrawalData.method,
        status: withdrawalData.status,
        notes: withdrawalData.notes,
        createdAt: new Date(),
      });

      return await withdrawal.save();
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      throw new Error(
        `Failed to create withdrawal: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get withdrawal by ID
   */
  async getWithdrawalById(withdrawalId: string): Promise<IWithdrawal | null> {
    try {
      return await Withdrawal.findById(withdrawalId);
    } catch (error) {
      console.error("Error fetching withdrawal:", error);
      throw new Error(
        `Failed to fetch withdrawal: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get withdrawal by reference number
   */
  async getWithdrawalByReference(
    reference: string
  ): Promise<IWithdrawal | null> {
    try {
      return await Withdrawal.findOne({ reference });
    } catch (error) {
      console.error("Error fetching withdrawal by reference:", error);
      throw new Error(
        `Failed to fetch withdrawal by reference: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get all withdrawals for a user
   */
  async getUserWithdrawals(
    userId: string,
    options: WithdrawalQueryOptions = {}
  ): Promise<IWithdrawal[]> {
    try {
      const { limit = 10, skip = 0, sort = { createdAt: -1 } } = options;

      return await Withdrawal.find({ userId })
        .sort(sort)
        .skip(skip)
        .limit(limit);
    } catch (error) {
      console.error("Error fetching user withdrawals:", error);
      throw new Error(
        `Failed to fetch user withdrawals: ${(error as Error).message}`
      );
    }
  }

  /**
   * Update withdrawal status
   */
  async updateWithdrawalStatus(
    withdrawalId: string,
    status: WithdrawalStatus
  ): Promise<IWithdrawal | null> {
    try {
      return await Withdrawal.findByIdAndUpdate(
        withdrawalId,
        {
          status,
          updatedAt: new Date(),
        },
        { new: true }
      );
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      throw new Error(
        `Failed to update withdrawal status: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get total withdrawn amount for a user
   */
  async getTotalWithdrawnAmount(userId: string): Promise<number> {
    try {
      const result = await Withdrawal.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            status: "completed",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error("Error calculating total withdrawn amount:", error);
      throw new Error(
        `Failed to calculate total withdrawn amount: ${
          (error as Error).message
        }`
      );
    }
  }

  /**
   * Process bank withdrawal status update
   * This method can be used when you've completed the manual bank transfer
   */
  async processBankWithdrawal(
    reference: string,
    status: WithdrawalStatus,
    notes?: string
  ): Promise<IWithdrawal | null> {
    try {
      return await Withdrawal.findOneAndUpdate(
        { reference, method: "bank" },
        {
          status,
          notes: notes,
          updatedAt: new Date(),
        },
        { new: true }
      );
    } catch (error) {
      console.error("Error processing bank withdrawal:", error);
      throw new Error(
        `Failed to process bank withdrawal: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get pending bank withdrawals
   */
  async getPendingBankWithdrawals(): Promise<IWithdrawal[]> {
    try {
      return await Withdrawal.find({
        method: "bank",
        status: "pending",
      }).sort({ createdAt: 1 });
    } catch (error) {
      console.error("Error fetching pending bank withdrawals:", error);
      throw new Error(
        `Failed to fetch pending bank withdrawals: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get withdrawal statistics for a time period
   */
  async getWithdrawalStats(
    startDate: Date,
    endDate: Date
  ): Promise<WithdrawalStats> {
    try {
      const stats = await Withdrawal.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" },
          },
        },
      ]);

      return stats.length > 0
        ? (stats[0] as WithdrawalStats)
        : { totalAmount: 0, count: 0, avgAmount: 0 };
    } catch (error) {
      console.error("Error fetching withdrawal statistics:", error);
      throw new Error(
        `Failed to fetch withdrawal statistics: ${(error as Error).message}`
      );
    }
  }
}

export default new WithdrawalService();
