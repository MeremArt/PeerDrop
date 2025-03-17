"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Withdrawal_1 = __importDefault(require("../models/Withdrawal"));
class WithdrawalService {
    /**
     * Create a new withdrawal record
     */
    async createWithdrawal(withdrawalData) {
        try {
            const withdrawal = new Withdrawal_1.default({
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
        }
        catch (error) {
            console.error("Error creating withdrawal:", error);
            throw new Error(`Failed to create withdrawal: ${error.message}`);
        }
    }
    /**
     * Get withdrawal by ID
     */
    async getWithdrawalById(withdrawalId) {
        try {
            return await Withdrawal_1.default.findById(withdrawalId);
        }
        catch (error) {
            console.error("Error fetching withdrawal:", error);
            throw new Error(`Failed to fetch withdrawal: ${error.message}`);
        }
    }
    /**
     * Get withdrawal by reference number
     */
    async getWithdrawalByReference(reference) {
        try {
            return await Withdrawal_1.default.findOne({ reference });
        }
        catch (error) {
            console.error("Error fetching withdrawal by reference:", error);
            throw new Error(`Failed to fetch withdrawal by reference: ${error.message}`);
        }
    }
    /**
     * Get all withdrawals for a user
     */
    async getUserWithdrawals(userId, options = {}) {
        try {
            const { limit = 10, skip = 0, sort = { createdAt: -1 } } = options;
            return await Withdrawal_1.default.find({ userId })
                .sort(sort)
                .skip(skip)
                .limit(limit);
        }
        catch (error) {
            console.error("Error fetching user withdrawals:", error);
            throw new Error(`Failed to fetch user withdrawals: ${error.message}`);
        }
    }
    /**
     * Update withdrawal status
     */
    async updateWithdrawalStatus(withdrawalId, status) {
        try {
            return await Withdrawal_1.default.findByIdAndUpdate(withdrawalId, {
                status,
                updatedAt: new Date(),
            }, { new: true });
        }
        catch (error) {
            console.error("Error updating withdrawal status:", error);
            throw new Error(`Failed to update withdrawal status: ${error.message}`);
        }
    }
    /**
     * Get total withdrawn amount for a user
     */
    async getTotalWithdrawnAmount(userId) {
        try {
            const result = await Withdrawal_1.default.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.default.Types.ObjectId(userId),
                        status: "completed",
                    },
                },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]);
            return result.length > 0 ? result[0].total : 0;
        }
        catch (error) {
            console.error("Error calculating total withdrawn amount:", error);
            throw new Error(`Failed to calculate total withdrawn amount: ${error.message}`);
        }
    }
    /**
     * Process bank withdrawal status update
     * This method can be used when you've completed the manual bank transfer
     */
    async processBankWithdrawal(reference, status, notes) {
        try {
            return await Withdrawal_1.default.findOneAndUpdate({ reference, method: "bank" }, {
                status,
                notes: notes,
                updatedAt: new Date(),
            }, { new: true });
        }
        catch (error) {
            console.error("Error processing bank withdrawal:", error);
            throw new Error(`Failed to process bank withdrawal: ${error.message}`);
        }
    }
    /**
     * Get pending bank withdrawals
     */
    async getPendingBankWithdrawals() {
        try {
            return await Withdrawal_1.default.find({
                method: "bank",
                status: "pending",
            }).sort({ createdAt: 1 });
        }
        catch (error) {
            console.error("Error fetching pending bank withdrawals:", error);
            throw new Error(`Failed to fetch pending bank withdrawals: ${error.message}`);
        }
    }
    /**
     * Get withdrawal statistics for a time period
     */
    async getWithdrawalStats(startDate, endDate) {
        try {
            const stats = await Withdrawal_1.default.aggregate([
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
                ? stats[0]
                : { totalAmount: 0, count: 0, avgAmount: 0 };
        }
        catch (error) {
            console.error("Error fetching withdrawal statistics:", error);
            throw new Error(`Failed to fetch withdrawal statistics: ${error.message}`);
        }
    }
}
exports.default = new WithdrawalService();
