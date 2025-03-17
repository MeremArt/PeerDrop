import { WithdrawalMethod, WithdrawalStatus } from "../types";
import { Types } from "mongoose";
export interface WithdrawalData {
  userId: Types.ObjectId | string;
  amount: number;
  destinationWallet?: string;
  bankDetails?: Record<string, any>;
  reference?: string;
  transactionId: string;
  method: WithdrawalMethod;
  status: WithdrawalStatus;
  notes?: string;
}

export interface WithdrawalQueryOptions {
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
}

export interface WithdrawalStats {
  totalAmount: number;
  count: number;
  avgAmount: number;
}
