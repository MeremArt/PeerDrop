"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BANK_PROCESSING_TIME = exports.MINIMUM_WITHDRAWAL = exports.WITHDRAWAL_FEE_PERCENTAGE = exports.TREASURY_WALLET_ADDRESS = void 0;
// src/config/treasury.ts
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
// Treasury wallet address for receiving funds from bank withdrawals
exports.TREASURY_WALLET_ADDRESS = process.env.TREASURY_WALLET_ADDRESS || "Your_Treasury_Wallet_Public_Key";
// Fee configuration
exports.WITHDRAWAL_FEE_PERCENTAGE = parseFloat(process.env.WITHDRAWAL_FEE_PERCENTAGE || "1");
// Minimum amount for withdrawals
exports.MINIMUM_WITHDRAWAL = parseFloat(process.env.MINIMUM_WITHDRAWAL || "10");
// Processing time estimates (in business days)
exports.BANK_PROCESSING_TIME = {
    min: parseInt(process.env.MIN_PROCESSING_DAYS || "1", 10),
    max: parseInt(process.env.MAX_PROCESSING_DAYS || "3", 10),
};
