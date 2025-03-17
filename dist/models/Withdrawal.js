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
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/Withdrawal.ts
const mongoose_1 = __importStar(require("mongoose"));
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
const withdrawalSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.String,
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
        type: mongoose_1.Schema.Types.Mixed,
        required: function () {
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
exports.default = mongoose_1.default.model("Withdrawal", withdrawalSchema);
