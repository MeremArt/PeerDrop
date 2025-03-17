import { Request, Response } from "express";
import { validationResult } from "express-validator";
import userService from "../services/user.service";
import withdrawalService from "../services/withdrawal.service";
import { PublicKey } from "@solana/web3.js";
import solanaService from "../services/solana.service";
import * as treasuryConfig from "../config/treasury";
import { Types } from "mongoose";
interface TransactionRequest {
  fromTiktok: string; // Changed from fromPhone
  toTiktok: string; // Changed from toPhone
  amount: number;
}

export const sendTransaction = async (
  req: Request<{}, {}, TransactionRequest>,
  res: Response
) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fromTiktok, toTiktok, amount } = req.body;

    // Get sender and receiver details
    const sender = await userService.findByTiktokUsername(fromTiktok);
    const receiver = await userService.findByTiktokUsername(toTiktok);

    if (!sender || !receiver) {
      return res.status(404).json({
        message: !sender ? "Sender not found" : "Receiver not found",
      });
    }

    // Check sender's balance
    const balance = await solanaService.getBalance(sender.walletAddress);
    if (balance < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
        required: amount,
        available: balance,
      });
    }

    // Create and send transaction
    const transaction = await solanaService.sendTransaction(
      sender.privateKey,
      receiver.walletAddress,
      amount
    );

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
  } catch (error) {
    return res.status(500).json({
      message: "Error processing transaction",
      error: (error as Error).message,
    });
  }
};

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

export const getTransactionStatus = async (req: Request, res: Response) => {
  try {
    const { signature } = req.params;
    const status = await solanaService.getTransactionStatus(signature);

    return res.json({
      signature,
      status,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching transaction status",
      error: (error as Error).message,
    });
  }
};

export const getWalletBalance = async (req: Request, res: Response) => {
  try {
    const { tiktokUsername } = req.params;

    const user = await userService.findByTiktokUsername(tiktokUsername);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const [solBalance, sonicBalance] = await Promise.all([
      solanaService.getBalance(user.walletAddress),
      solanaService.checkTokenAccount(user.walletAddress),
    ]);

    // Get token balance only if account exists
    const tokenBalance = sonicBalance.exists
      ? await solanaService.getTokenBalance(user.walletAddress)
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
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching balances",
      error: (error as Error).message,
    });
  }
};

export const getTransactionHistory = async (req: Request, res: Response) => {
  try {
    const { tiktokUsername } = req.params;
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;

    const user = await userService.findByTiktokUsername(tiktokUsername);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactions = await solanaService.getTransactionHistory(
      user.walletAddress,
      limit,
      offset
    );

    return res.json({
      transactions,
      pagination: {
        limit,
        offset,
        total: transactions.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching transaction history",
      error: (error as Error).message,
    });
  }
};

export const getBalance = async (
  req: Request<{ tiktokUsername: string }>,
  res: Response
) => {
  try {
    const { tiktokUsername } = req.params;

    // Find user by TikTok username
    const user = await userService.findByTiktokUsername(tiktokUsername);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Get balance from Solana
    const balance = await solanaService.getBalance(user.walletAddress);

    return res.json({
      tiktokUsername: user.tiktokUsername,
      walletAddress: user.walletAddress,
      balance: balance,
      timestamp: new Date(),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching balance",
      error: (error as Error).message,
    });
  }
};

// Modified approach for wallet withdrawals:

export const withdrawToBank = async (req: Request, res: Response) => {
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
    const user = await userService.findByTiktokUsername(tiktokUsername);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check user's token balance (Note: now checking token balance instead of SOL balance)
    const tokenBalance = await solanaService.getTokenBalance(
      user.walletAddress
    );
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
    // This requires a transaction to your treasury wallet using the sendTransaction
    // method that handles token transfers
    const transaction = await solanaService.sendTransaction(
      user.privateKey,
      treasuryConfig.TREASURY_WALLET_ADDRESS, // Your company's treasury wallet
      amount // The amount will be in token units
    );

    // Create a pending bank withdrawal record
    const withdrawalReference = `SON-${Date.now()
      .toString()
      .slice(-8)}-${Math.floor(Math.random() * 1000)}`;

    const userId =
      user._id instanceof Types.ObjectId
        ? user._id.toString()
        : String(user._id);

    const withdrawal = await withdrawalService.createWithdrawal({
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
  } catch (error) {
    return res.status(500).json({
      message: "Error processing withdrawal request",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Validates if a string is a valid Solana address (base58 encoded)
 */
function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    console.error("Invalid Solana address:", error);
    return false;
  }
}

/**
 * Sanitizes a wallet address string
 */
function sanitizeWalletAddress(address: string): string {
  return address.trim();
}

export const withdrawToExternalWallet = async (req: Request, res: Response) => {
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
    console.log(
      `Original wallet: "${destinationWallet}", Sanitized wallet: "${sanitizedWallet}"`
    );

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
    const user = await userService.findByTiktokUsername(tiktokUsername);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has enough SOINC tokens
    const tokenBalance = await solanaService.getTokenBalance(
      user.walletAddress
    );
    if (tokenBalance < parsedAmount) {
      return res.status(400).json({
        message: "Insufficient token balance",
        required: parsedAmount,
        available: tokenBalance,
      });
    }

    // Make sure user has enough SOL to pay for transaction fees
    const solBalance = await solanaService.getBalance(user.walletAddress);
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

    console.log(
      `Processing withdrawal: ${parsedAmount} SOINC from ${user.walletAddress} to ${sanitizedWallet}`
    );
    console.log(
      `Fee: ${fee} SOINC (${feePercentage}%), Amount after fee: ${amountAfterFee} SOINC`
    );

    // Send tokens directly to user's destination wallet
    let transactionId = null;
    try {
      console.log(
        `Sending ${amountAfterFee} SOINC to destination: ${sanitizedWallet}`
      );
      transactionId = await solanaService.sendTransaction(
        user.privateKey,
        sanitizedWallet,
        amountAfterFee
      );
      console.log(`Transaction successful: ${transactionId}`);
    } catch (txError) {
      console.error("Transaction error details:", txError);

      // Check for common error types and provide better error messages
      const errorMessage =
        txError instanceof Error ? txError.message : String(txError);

      if (
        errorMessage.includes("insufficient lamports") ||
        errorMessage.includes("0x1")
      ) {
        return res.status(400).json({
          message: "Insufficient SOL to pay for transaction fees",
          error: "Please add more SOL to your wallet to cover transaction fees",
        });
      } else if (errorMessage.includes("Non-base58 character")) {
        return res.status(400).json({
          message: "Invalid wallet address format",
          error: "The destination wallet address contains invalid characters",
        });
      } else {
        return res.status(500).json({
          message: "Transaction error",
          error: errorMessage,
        });
      }
    }

    // Record withdrawal in database with fee information
    const userId =
      user._id instanceof Types.ObjectId
        ? user._id.toString()
        : String(user._id);

    try {
      // Note that we're tracking the fee in the notes, even though we're not sending it separately
      const withdrawal = await withdrawalService.createWithdrawal({
        userId,
        amount: amountAfterFee, // We send the amount after fee
        destinationWallet: sanitizedWallet,
        transactionId: transactionId as string,
        method: "wallet",
        status: "completed",
        notes: fee > 0 ? `Fee: ${fee} (${feePercentage}%)` : undefined,
      });
      console.log(`Withdrawal record created: ${withdrawal._id}`);
    } catch (dbError) {
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
  } catch (error) {
    console.error("Wallet withdrawal error:", error);
    return res.status(500).json({
      message: "Error processing withdrawal",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
