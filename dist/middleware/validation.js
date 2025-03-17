"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWithdrawalRequest = void 0;
const validateWithdrawalRequest = (req, res, next) => {
    const { tiktokUsername, amount } = req.body;
    const errors = [];
    // Check required fields
    if (!tiktokUsername) {
        errors.push("TikTok username is required");
    }
    if (!amount) {
        errors.push("Amount is required");
    }
    else if (isNaN(amount) || amount <= 0) {
        errors.push("Amount must be a positive number");
    }
    // Check specific fields based on route
    if (req.path === "/wallet") {
        const { destinationWallet } = req.body;
        if (!destinationWallet) {
            errors.push("Destination wallet address is required");
        }
        else if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(destinationWallet)) {
            // Basic regex for Solana wallet format
            errors.push("Invalid Solana wallet address format");
        }
    }
    else if (req.path === "/bank") {
        const { bankDetails } = req.body;
        if (!bankDetails) {
            errors.push("Bank details are required");
        }
        else {
            // Validate bank details
            const { accountName, accountNumber, bankName } = bankDetails;
            if (!accountName) {
                errors.push("Account name is required");
            }
            if (!accountNumber) {
                errors.push("Account number is required");
            }
            if (!bankName) {
                errors.push("Bank name is required");
            }
        }
    }
    // Return errors if any
    if (errors.length > 0) {
        return res.status(400).json({
            message: "Validation failed",
            errors,
        });
    }
    next();
};
exports.validateWithdrawalRequest = validateWithdrawalRequest;
