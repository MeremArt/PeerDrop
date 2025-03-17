// src/models/Withdrawal.ts
import mongoose, { Schema } from "mongoose";
import { IWithdrawal } from "../types";

/**
 * @swagger
 * components:
 *   schemas:
 *     Withdrawal:
 *       type: object
 *       required:
 *         - userId
 *         - amount
 *         - destinationWallet
 *         - transactionId
 *         - method
 *         - status
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         userId:
 *           type: string
 *           description: User ID reference
 *         amount:
 *           type: number
 *           description: Amount withdrawn
 *         destinationWallet:
 *           type: string
 *           description: Destination wallet address
 *         transactionId:
 *           type: string
 *           description: Blockchain transaction ID
 *         method:
 *           type: string
 *           enum: [wallet, bank, paypal, other]
 *           description: Withdrawal method
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *           description: Withdrawal status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Withdrawal request timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         notes:
 *           type: string
 *           description: Additional notes or information
 */
const withdrawalSchema = new Schema<IWithdrawal>({
  userId: {
    type: Schema.Types.String,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  destinationWallet: {
    type: String,
    required: true,
  },
  bankDetails: {
    type: Schema.Types.Mixed,
    required: function (this: IWithdrawal) {
      return this.method === "bank";
    },
  },
  transactionId: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    enum: ["wallet", "bank", "paypal", "other"],
    default: "wallet",
  },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
  notes: {
    type: String,
  },
});

// Index for faster queries
withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ transactionId: 1 }, { unique: true });

export default mongoose.model<IWithdrawal>("Withdrawal", withdrawalSchema);
