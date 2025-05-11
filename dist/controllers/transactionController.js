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
exports.withdrawToExternalWallet = exports.withdrawToBank = exports.getBalance = exports.getTransactionHistory = exports.getWalletBalance = exports.getTransactionStatus = exports.sendTransaction = void 0;
const express_validator_1 = require("express-validator");
const user_service_1 = __importDefault(require("../services/user.service"));
const withdrawal_service_1 = __importDefault(require("../services/withdrawal.service"));
const web3_js_1 = require("@solana/web3.js");
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
        // Check if sender has privateKey (required for traditional accounts)
        if (!sender.privateKey) {
            return res.status(400).json({
                message: "Cannot process transaction",
                error: "Sender does not have a managed wallet private key. For Civic Auth users, please send directly from your wallet.",
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
        // Create and send transaction - Use non-null assertion
        const transaction = await solana_service_1.default.sendTransaction(sender.privateKey, // Non-null assertion after check
        receiver.walletAddress, amount);
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
        // Check if user has privateKey (required for traditional accounts)
        if (!user.privateKey) {
            return res.status(400).json({
                message: "Cannot process withdrawal",
                error: "User does not have a managed wallet private key. For Civic Auth users, please withdraw directly from your wallet.",
            });
        }
        // Check user's token balance
        const tokenBalance = await solana_service_1.default.getTokenBalance(user.walletAddress);
        if (tokenBalance < amount) {
            return res.status(400).json({
                message: "Insufficient token balance",
                required: amount,
                available: tokenBalance,
            });
        }
        // Calculate fee if applicable
        const feePercentage = treasuryConfig.WITHDRAWAL_FEE_PERCENTAGE;
        const fee = (amount * feePercentage) / 100;
        const amountAfterFee = amount - fee;
        // Deduct tokens from user's account
        // Use non-null assertion (!) since we've already checked for null above
        const transaction = await solana_service_1.default.sendTransaction(user.privateKey, // Non-null assertion
        treasuryConfig.TREASURY_WALLET_ADDRESS, amount);
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
/**
 * Validates if a string is a valid Solana address (base58 encoded)
 */
function isValidSolanaAddress(address) {
    try {
        new web3_js_1.PublicKey(address);
        return true;
    }
    catch (error) {
        console.error("Invalid Solana address:", error);
        return false;
    }
}
/**
 * Sanitizes a wallet address string
 */
function sanitizeWalletAddress(address) {
    return address.trim();
}
const withdrawToExternalWallet = async (req, res) => {
    try {
        console.log("Withdrawal request body:", JSON.stringify(req.body));
        const { tiktokUsername, destinationWallet, amount } = req.body;
        // Validate required fields
        if (!tiktokUsername || !destinationWallet || !amount) {
            return res.status(400).json({
                message: "Missing required fields",
                requiredFields: ["tiktokUsername", "destinationWallet", "amount"],
            });
        }
        // Sanitize and validate wallet address
        const sanitizedWallet = sanitizeWalletAddress(destinationWallet);
        console.log(`Original wallet: "${destinationWallet}", Sanitized wallet: "${sanitizedWallet}"`);
        if (!isValidSolanaAddress(sanitizedWallet)) {
            return res.status(400).json({
                message: "Invalid destination wallet address",
                error: "The provided address is not a valid Solana address",
            });
        }
        // Validate amount
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({
                message: "Invalid amount",
                error: "Amount must be a positive number",
            });
        }
        // Validate minimum withdrawal amount
        if (parsedAmount < treasuryConfig.MINIMUM_WITHDRAWAL) {
            return res.status(400).json({
                message: `Minimum withdrawal amount is ${treasuryConfig.MINIMUM_WITHDRAWAL}`,
                required: treasuryConfig.MINIMUM_WITHDRAWAL,
                available: parsedAmount,
            });
        }
        // Get user details
        const user = await user_service_1.default.findByTiktokUsername(tiktokUsername);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Check if user has privateKey (required for traditional accounts)
        if (!user.privateKey) {
            return res.status(400).json({
                message: "Cannot process withdrawal",
                error: "User does not have a managed wallet private key. For Civic Auth users, please withdraw directly from your wallet.",
            });
        }
        // Check if user has enough SOINC tokens
        const tokenBalance = await solana_service_1.default.getTokenBalance(user.walletAddress);
        if (tokenBalance < parsedAmount) {
            return res.status(400).json({
                message: "Insufficient token balance",
                required: parsedAmount,
                available: tokenBalance,
            });
        }
        // Make sure user has enough SOL to pay for transaction fees
        const solBalance = await solana_service_1.default.getBalance(user.walletAddress);
        if (solBalance < 0.01) {
            // Minimum SOL for transaction fees
            return res.status(400).json({
                message: "Insufficient SOL for transaction fees",
                required: 0.01,
                available: solBalance,
            });
        }
        // Calculate fee if applicable
        const feePercentage = treasuryConfig.WITHDRAWAL_FEE_PERCENTAGE;
        const fee = (parsedAmount * feePercentage) / 100;
        const amountAfterFee = parsedAmount - fee;
        console.log(`Processing withdrawal: ${parsedAmount} SOINC from ${user.walletAddress} to ${sanitizedWallet}`);
        console.log(`Fee: ${fee} SOINC (${feePercentage}%), Amount after fee: ${amountAfterFee} SOINC`);
        // Send tokens directly to user's destination wallet - Now using non-null assertion since we checked above
        let transactionId = null;
        try {
            console.log(`Sending ${amountAfterFee} SOINC to destination: ${sanitizedWallet}`);
            // Use non-null assertion (!) since we've already checked for null above
            transactionId = await solana_service_1.default.sendTransaction(user.privateKey, // Non-null assertion
            sanitizedWallet, amountAfterFee);
            console.log(`Transaction successful: ${transactionId}`);
        }
        catch (txError) {
            console.error("Transaction error details:", txError);
            // Check for common error types and provide better error messages
            const errorMessage = txError instanceof Error ? txError.message : String(txError);
            if (errorMessage.includes("insufficient lamports") ||
                errorMessage.includes("0x1")) {
                return res.status(400).json({
                    message: "Insufficient SOL to pay for transaction fees",
                    error: "Please add more SOL to your wallet to cover transaction fees",
                });
            }
            else if (errorMessage.includes("Non-base58 character")) {
                return res.status(400).json({
                    message: "Invalid wallet address format",
                    error: "The destination wallet address contains invalid characters",
                });
            }
            else {
                return res.status(500).json({
                    message: "Transaction error",
                    error: errorMessage,
                });
            }
        }
        // Record withdrawal in database with fee information
        const userId = user._id instanceof mongoose_1.Types.ObjectId
            ? user._id.toString()
            : String(user._id);
        try {
            // Note that we're tracking the fee in the notes, even though we're not sending it separately
            const withdrawal = await withdrawal_service_1.default.createWithdrawal({
                userId,
                amount: amountAfterFee, // We send the amount after fee
                destinationWallet: sanitizedWallet,
                transactionId: transactionId,
                method: "wallet",
                status: "completed",
                notes: fee > 0 ? `Fee: ${fee} (${feePercentage}%)` : undefined,
            });
            console.log(`Withdrawal record created: ${withdrawal._id}`);
        }
        catch (dbError) {
            console.error("Database error when recording withdrawal:", dbError);
            // We'll still return success to the user since the transaction succeeded,
            // but log the database error for investigation
        }
        // Return transaction details
        return res.json({
            message: "Withdrawal completed successfully",
            transactionId: transactionId,
            from: {
                username: user.tiktokUsername,
                wallet: user.walletAddress,
            },
            to: {
                wallet: sanitizedWallet,
            },
            amount: amountAfterFee,
            fee: fee,
            originalAmount: parsedAmount,
            timestamp: new Date(),
        });
    }
    catch (error) {
        console.error("Wallet withdrawal error:", error);
        return res.status(500).json({
            message: "Error processing withdrawal",
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.withdrawToExternalWallet = withdrawToExternalWallet;
