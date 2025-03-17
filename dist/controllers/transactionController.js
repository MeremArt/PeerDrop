"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawToBank = exports.withdrawToExternalWallet = exports.getBalance = exports.getTransactionHistory = exports.getWalletBalance = exports.getTransactionStatus = exports.sendTransaction = void 0;
const express_validator_1 = require("express-validator");
const user_service_1 = __importDefault(require("../services/user.service"));
const withdrawal_service_1 = __importDefault(require("../services/withdrawal.service"));
const solana_service_1 = __importDefault(require("../services/solana.service"));
const treasuryConfig = __importStar(require("../config/treasury"));
const mongoose_1 = require("mongoose");
const sendTransaction = async (req, res) => {
    try {
        // Validate request
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { fromTiktok, toTiktok, amount } = req.body;
        // Get sender and receiver details
        const sender = await user_service_1.default.findByTiktokUsername(fromTiktok);
        const receiver = await user_service_1.default.findByTiktokUsername(toTiktok);
        if (!sender || !receiver) {
            return res.status(404).json({
                message: !sender ? "Sender not found" : "Receiver not found",
            });
        }
        // Check sender's balance
        const balance = await solana_service_1.default.getBalance(sender.walletAddress);
        if (balance < amount) {
            return res.status(400).json({
                message: "Insufficient balance",
                required: amount,
                available: balance,
            });
        }
        // Create and send transaction
        const transaction = await solana_service_1.default.sendTransaction(sender.privateKey, receiver.walletAddress, amount);
        // Return transaction details
        return res.json({
            message: "Transaction initiated successfully",
            transactionId: transaction,
            from: {
                username: sender.tiktokUsername,
                wallet: sender.walletAddress,
            },
            to: {
                username: receiver.tiktokUsername,
                wallet: receiver.walletAddress,
            },
            amount,
            timestamp: new Date(),
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error processing transaction",
            error: error.message,
        });
    }
};
exports.sendTransaction = sendTransaction;
// Modified approach for wallet withdrawals:
// export const withdrawToExternalWallet = async (req, res) => {
//   try {
//     const { tiktokUsername, destinationWallet, amount } = req.body;
//     // Get user details
//     const user = await userService.findByTiktokUsername(tiktokUsername);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     // Check user's balance
//     const balance = await solanaService.getBalance(user.walletAddress);
//     if (balance < amount) {
//       return res.status(400).json({
//         message: "Insufficient balance",
//         required: amount,
//         available: balance,
//       });
//     }
//     // Create and send transaction from user's custodial wallet to their external wallet
//     const transaction = await solanaService.sendTransaction(
//       user.privateKey, // Your server has the private key for the user's custodial wallet
//       destinationWallet, // The external wallet address provided by the user
//       amount
//     );
//     // Record withdrawal in database
//     const withdrawal = await withdrawalService.createWithdrawal({
//       userId: user.id,
//       amount,
//       destinationWallet,
//       transactionId: transaction,
//       method: "wallet",
//       status: "completed",
//     });
//     // Return transaction details
//     return res.json({
//       message: "Withdrawal completed successfully",
//       transactionId: transaction,
//       from: {
//         username: user.tiktokUsername,
//         wallet: user.walletAddress,
//       },
//       to: {
//         wallet: destinationWallet,
//       },
//       amount,
//       timestamp: new Date(),
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Error processing withdrawal",
//       error: (error as Error).message,
//     });
//   }
// };
const getTransactionStatus = async (req, res) => {
    try {
        const { signature } = req.params;
        const status = await solana_service_1.default.getTransactionStatus(signature);
        return res.json({
            signature,
            status,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error fetching transaction status",
            error: error.message,
        });
    }
};
exports.getTransactionStatus = getTransactionStatus;
const getWalletBalance = async (req, res) => {
    try {
        const { tiktokUsername } = req.params;
        const user = await user_service_1.default.findByTiktokUsername(tiktokUsername);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        const [solBalance, sonicBalance] = await Promise.all([
            solana_service_1.default.getBalance(user.walletAddress),
            solana_service_1.default.checkTokenAccount(user.walletAddress),
        ]);
        // Get token balance only if account exists
        const tokenBalance = sonicBalance.exists
            ? await solana_service_1.default.getTokenBalance(user.walletAddress)
            : 0;
        return res.json({
            tiktokUsername: user.tiktokUsername,
            walletAddress: user.walletAddress,
            balances: {
                sol: solBalance,
                sonic: tokenBalance,
            },
            tokenAccount: {
                address: sonicBalance.address,
                exists: sonicBalance.exists,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error fetching balances",
            error: error.message,
        });
    }
};
exports.getWalletBalance = getWalletBalance;
const getTransactionHistory = async (req, res) => {
    try {
        const { tiktokUsername } = req.params;
        const limit = Number(req.query.limit) || 10;
        const offset = Number(req.query.offset) || 0;
        const user = await user_service_1.default.findByTiktokUsername(tiktokUsername);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const transactions = await solana_service_1.default.getTransactionHistory(user.walletAddress, limit, offset);
        return res.json({
            transactions,
            pagination: {
                limit,
                offset,
                total: transactions.length,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error fetching transaction history",
            error: error.message,
        });
    }
};
exports.getTransactionHistory = getTransactionHistory;
const getBalance = async (req, res) => {
    try {
        const { tiktokUsername } = req.params;
        // Find user by TikTok username
        const user = await user_service_1.default.findByTiktokUsername(tiktokUsername);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        // Get balance from Solana
        const balance = await solana_service_1.default.getBalance(user.walletAddress);
        return res.json({
            tiktokUsername: user.tiktokUsername,
            walletAddress: user.walletAddress,
            balance: balance,
            timestamp: new Date(),
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error fetching balance",
            error: error.message,
        });
    }
};
exports.getBalance = getBalance;
// Modified approach for wallet withdrawals:
const withdrawToExternalWallet = async (req, res) => {
    try {
        const { tiktokUsername, destinationWallet, amount } = req.body;
        // Get user details
        const user = await user_service_1.default.findByTiktokUsername(tiktokUsername);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Check user's balance
        const balance = await solana_service_1.default.getBalance(user.walletAddress);
        if (balance < amount) {
            return res.status(400).json({
                message: "Insufficient balance",
                required: amount,
                available: balance,
            });
        }
        // Create and send transaction from user's custodial wallet to their external wallet
        const transaction = await solana_service_1.default.sendTransaction(user.privateKey, destinationWallet, amount);
        // Convert userId to string if it's an ObjectId
        const userId = user._id instanceof mongoose_1.Types.ObjectId
            ? user._id.toString()
            : String(user._id);
        // Record withdrawal in database
        const withdrawal = await withdrawal_service_1.default.createWithdrawal({
            userId, // Now properly handled
            amount,
            destinationWallet,
            transactionId: transaction,
            method: "wallet",
            status: "completed",
        });
        // Return transaction details
        return res.json({
            message: "Withdrawal completed successfully",
            transactionId: transaction,
            from: {
                username: user.tiktokUsername,
                wallet: user.walletAddress,
            },
            to: {
                wallet: destinationWallet,
            },
            amount,
            timestamp: new Date(),
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error processing withdrawal",
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.withdrawToExternalWallet = withdrawToExternalWallet;
const withdrawToBank = async (req, res) => {
    try {
        const { tiktokUsername, bankDetails, amount } = req.body;
        // Validate minimum withdrawal amount
        if (amount < treasuryConfig.MINIMUM_WITHDRAWAL) {
            return res.status(400).json({
                message: `Minimum withdrawal amount is ${treasuryConfig.MINIMUM_WITHDRAWAL}`,
                required: treasuryConfig.MINIMUM_WITHDRAWAL,
                available: amount,
            });
        }
        // Get user details
        const user = await user_service_1.default.findByTiktokUsername(tiktokUsername);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Check user's balance
        const balance = await solana_service_1.default.getBalance(user.walletAddress);
        if (balance < amount) {
            return res.status(400).json({
                message: "Insufficient balance",
                required: amount,
                available: balance,
            });
        }
        // Calculate fee if applicable
        const feePercentage = treasuryConfig.WITHDRAWAL_FEE_PERCENTAGE;
        const fee = (amount * feePercentage) / 100;
        const amountAfterFee = amount - fee;
        // Deduct tokens from user's account
        // This requires a transaction to your treasury wallet
        const transaction = await solana_service_1.default.sendTransaction(user.privateKey, treasuryConfig.TREASURY_WALLET_ADDRESS, // Your company's treasury wallet
        amount);
        // Create a pending bank withdrawal record
        const withdrawalReference = `SON-${Date.now()
            .toString()
            .slice(-8)}-${Math.floor(Math.random() * 1000)}`;
        const userId = user._id instanceof mongoose_1.Types.ObjectId
            ? user._id.toString()
            : String(user._id);
        const withdrawal = await withdrawal_service_1.default.createWithdrawal({
            userId,
            amount: amountAfterFee, // Record the amount after fee
            bankDetails,
            transactionId: transaction,
            reference: withdrawalReference,
            method: "bank",
            status: "pending", // Bank transfers need manual processing
            notes: fee > 0 ? `Fee: ${fee} (${feePercentage}%)` : undefined,
        });
        // Return withdrawal details
        return res.json({
            message: "Withdrawal request submitted successfully",
            reference: withdrawalReference,
            amount: amountAfterFee,
            fee: fee,
            originalAmount: amount,
            status: "pending",
            estimatedProcessingTime: "1-3 business days",
            timestamp: new Date(),
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error processing withdrawal request",
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.withdrawToBank = withdrawToBank;
