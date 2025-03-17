// src/config/treasury.ts
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Treasury wallet address for receiving funds from bank withdrawals
export const TREASURY_WALLET_ADDRESS =
  process.env.TREASURY_WALLET_ADDRESS || "Your_Treasury_Wallet_Public_Key";

// Fee configuration
export const WITHDRAWAL_FEE_PERCENTAGE = parseFloat(
  process.env.WITHDRAWAL_FEE_PERCENTAGE || "0.1"
);

// Minimum amount for withdrawals
export const MINIMUM_WITHDRAWAL = parseFloat(
  process.env.MINIMUM_WITHDRAWAL || "1"
);

// Processing time estimates (in business days)
export const BANK_PROCESSING_TIME = {
  min: parseInt(process.env.MIN_PROCESSING_DAYS || "1", 10),
  max: parseInt(process.env.MAX_PROCESSING_DAYS || "3", 10),
};
