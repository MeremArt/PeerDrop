import { Document } from "mongoose";
import { Request } from "express";
import { Transaction, PublicKey } from "@solana/web3.js";

export interface IUser extends Document {
  email: string;
  password: string;
  walletAddress: string;
  privateKey: string;
  tiktokUsername?: string;
  createdAt: Date;

  // New fields for token account
  tokenAccountAddress?: string;
  tokenAccountCreated: boolean;
  tokenAccountCreationDate?: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface TransactionRequest {
  fromPhone: string;
  toPhone: string;
  amount: number;
}

export interface UserRegistrationData {
  email: string;
  tiktokUsername?: string;
  password?: string;
  walletAddress?: string;
}

export interface CustomError extends Error {
  statusCode?: number;
}
export type WithdrawalStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";
export type WithdrawalMethod = "wallet" | "bank" | "paypal" | "other";

export interface IWithdrawal extends Document {
  userId: string;
  amount: number;
  destinationWallet?: string;
  bankDetails?: Record<string, any>;
  reference?: string;
  transactionId: string;
  method: WithdrawalMethod;
  status: WithdrawalStatus;
  createdAt: Date;
  updatedAt?: Date;
  notes?: string;
}

export interface WithdrawalResponse {
  message: string;
  transactionId: string;
  from: {
    username: string;
    wallet: string;
  };
  to: {
    wallet: string;
  };
  amount: number;
  timestamp: Date;
}
