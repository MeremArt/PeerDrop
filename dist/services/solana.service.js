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
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const bs58_1 = __importDefault(require("bs58"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class SolanaService {
    constructor() {
        this.SOINC_DECIMALS = 9;
        const commitment = "processed";
        this.connection = new web3_js_1.Connection("https://api.mainnet-beta.solana.com", {
            commitment,
            wsEndpoint: "wss://api.mainnet-beta.solana.com",
        });
        this.soincMint = new web3_js_1.PublicKey("SonicxvLud67EceaEzCLRnMTBqzYUUYNr93DBkBdDES");
    }
    // Create a new wallet for user
    async createWallet(solAmount = 0.002039) {
        try {
            // Get the funder private key from environment variable
            const funderPrivateKey = process.env.WALLET_FUNDER_PRIVATE_KEY;
            if (!funderPrivateKey) {
                throw new Error("Funder wallet private key not found in environment variables (WALLET_FUNDER_PRIVATE_KEY)");
            }
            const keypair = web3_js_1.Keypair.generate();
            const publicKey = keypair.publicKey.toString();
            const privateKey = bs58_1.default.encode(keypair.secretKey);
            const funder = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(funderPrivateKey));
            // Get the associated token account address
            const tokenAccountAddress = await (0, spl_token_1.getAssociatedTokenAddress)(this.soincMint, keypair.publicKey, false, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
            // Check funder SOL balance to ensure it has enough
            const funderBalance = await this.connection.getBalance(funder.publicKey);
            const minimumAmount = solAmount * web3_js_1.LAMPORTS_PER_SOL;
            if (funderBalance < minimumAmount + 5000) {
                // Add buffer for transaction fees
                throw new Error(`Funder wallet has insufficient SOL. Current balance: ${funderBalance / web3_js_1.LAMPORTS_PER_SOL} SOL`);
            }
            // Get a fresh blockhash right before transaction
            const { blockhash: fundingBlockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            // 1. First transfer minimum SOL to the new wallet
            const fundingTx = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
                fromPubkey: funder.publicKey,
                toPubkey: keypair.publicKey,
                lamports: Math.floor(minimumAmount),
            }));
            fundingTx.recentBlockhash = fundingBlockhash;
            fundingTx.feePayer = funder.publicKey;
            // Sign and immediately send funding transaction
            fundingTx.sign(funder);
            const fundingTxSignature = await this.connection.sendRawTransaction(fundingTx.serialize());
            // Wait for confirmation with explicit blocking
            await this.connection.confirmTransaction({
                signature: fundingTxSignature,
                blockhash: fundingBlockhash,
                lastValidBlockHeight: lastValidBlockHeight,
            });
            // Add a small delay before creating token account
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // Get a fresh blockhash for the token account transaction
            const { blockhash: tokenBlockhash, lastValidBlockHeight: tokenLastValidBlockHeight, } = await this.connection.getLatestBlockhash();
            // 2. Now create the token account - funder will pay for this transaction
            const tokenAccountTx = new web3_js_1.Transaction().add((0, spl_token_1.createAssociatedTokenAccountInstruction)(funder.publicKey, // Payer
            tokenAccountAddress, // Associated token account address
            keypair.publicKey, // Owner
            this.soincMint, // Mint
            spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
            tokenAccountTx.recentBlockhash = tokenBlockhash;
            tokenAccountTx.feePayer = funder.publicKey;
            // Sign and immediately send token account transaction
            tokenAccountTx.sign(funder);
            const tokenAccountTxSignature = await this.connection.sendRawTransaction(tokenAccountTx.serialize());
            // Wait for confirmation with explicit blocking
            await this.connection.confirmTransaction({
                signature: tokenAccountTxSignature,
                blockhash: tokenBlockhash,
                lastValidBlockHeight: tokenLastValidBlockHeight,
            });
            return {
                publicKey,
                privateKey,
                tokenAccount: tokenAccountAddress.toString(),
                tokenAccountCreated: true,
                solTransferred: solAmount,
                fundingTxSignature,
                tokenAccountTxSignature,
            };
        }
        catch (error) {
            console.error("Wallet creation error:", error);
            throw new Error(`Failed to create wallet and token account: ${error.message}`);
        }
    }
    /**
     * Get token balance for a wallet address
     */
    async getTokenBalance(walletAddress) {
        try {
            const owner = new web3_js_1.PublicKey(walletAddress);
            // Get the associated token account
            const tokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(this.soincMint, owner, false, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
            const tokenBalance = await this.connection.getTokenAccountBalance(tokenAccount);
            return (Number(tokenBalance.value.amount) /
                Math.pow(10, tokenBalance.value.decimals));
        }
        catch (error) {
            if (error instanceof Error &&
                error.message.includes("account not found")) {
                // Return 0 if token account doesn't exist yet
                return 0;
            }
            throw new Error(`Failed to get token balance:${error.message}`);
        }
    }
    async createAssociatedTokenAccount(walletAddress, payerPrivateKey) {
        try {
            const walletPubKey = new web3_js_1.PublicKey(walletAddress);
            const payerKeypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(payerPrivateKey));
            // Get the associated token account address
            const tokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(this.soincMint, walletPubKey, false, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
            // Check if the token account already exists
            const account = await this.connection.getAccountInfo(tokenAccount);
            if (account !== null) {
                // Token account already exists
                return {
                    address: tokenAccount.toString(),
                    created: false,
                };
            }
            // Create a transaction to create the associated token account
            const transaction = new web3_js_1.Transaction().add((0, spl_token_1.createAssociatedTokenAccountInstruction)(payerKeypair.publicKey, // Payer
            tokenAccount, // Associated token account address
            walletPubKey, // Owner
            this.soincMint, // Mint
            spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
            // Get recent blockhash
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = payerKeypair.publicKey;
            // Sign and send transaction
            transaction.sign(payerKeypair);
            const signature = await this.connection.sendRawTransaction(transaction.serialize());
            // Wait for confirmation
            await this.connection.confirmTransaction(signature);
            return {
                address: tokenAccount.toString(),
                created: true,
            };
        }
        catch (error) {
            throw new Error(`Failed to create associated token account: ${error.message}`);
        }
    }
    async checkTokenAccount(walletAddress) {
        try {
            const owner = new web3_js_1.PublicKey(walletAddress);
            const tokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(this.soincMint, owner, false);
            const account = await this.connection.getAccountInfo(tokenAccount);
            return {
                exists: account !== null,
                address: tokenAccount.toString(),
            };
        }
        catch (error) {
            throw new Error(`Failed to check token account: ${error.message}`);
        }
    }
    async getOrCreateAssociatedTokenAccount(walletAddress) {
        try {
            const owner = new web3_js_1.PublicKey(walletAddress);
            const tokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(this.soincMint, owner, true, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
            const account = await this.connection.getAccountInfo(tokenAccount);
            return {
                address: tokenAccount.toString(),
                exists: account !== null,
            };
        }
        catch (error) {
            throw new Error(`Failed to check token account: ${error.message}`);
        }
    }
    async sendTransaction(fromPrivateKey, toWallet, amount) {
        try {
            console.log(`Transaction request: Sending ${amount} SOINC tokens to ${toWallet}`);
            // Your validation code...
            const fromKeypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(fromPrivateKey));
            const toPublicKey = new web3_js_1.PublicKey(toWallet);
            // Get token accounts
            const fromTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(this.soincMint, fromKeypair.publicKey, false);
            // Check if destination has a token account
            const toTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(this.soincMint, toPublicKey, false);
            // Check if destination token account exists
            const destAccount = await this.connection.getAccountInfo(toTokenAccount);
            if (!destAccount) {
                console.log("Destination token account doesn't exist, will need to create it");
                // This would require additional SOL for rent
            }
            // Convert amount to token units using the correct decimal places
            const tokenAmount = Math.round(amount * Math.pow(10, this.SOINC_DECIMALS));
            // Create token transfer instruction
            const transferInstruction = (0, spl_token_1.createTransferInstruction)(fromTokenAccount, toTokenAccount, fromKeypair.publicKey, tokenAmount, [], spl_token_1.TOKEN_PROGRAM_ID);
            const transaction = new web3_js_1.Transaction().add(transferInstruction);
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = fromKeypair.publicKey;
            // Sign and send transaction
            transaction.sign(fromKeypair);
            const signature = await this.connection.sendRawTransaction(transaction.serialize());
            // Wait for confirmation
            await this.connection.confirmTransaction(signature);
            return signature;
        }
        catch (error) {
            console.error("Transaction error details:", error);
            throw new Error(`Failed to send transaction: ${error.message}`);
        }
    }
    async getBalance(walletAddress) {
        try {
            const pubKey = new web3_js_1.PublicKey(walletAddress);
            const balance = await this.connection.getBalance(pubKey);
            return balance / web3_js_1.LAMPORTS_PER_SOL;
        }
        catch (error) {
            throw new Error(`Failed to get balance: ${error.message}`);
        }
    }
    async getTransactionStatus(signature) {
        try {
            const signatureStatus = await this.connection.getSignatureStatus(signature);
            if (!signatureStatus || !signatureStatus.value) {
                return "not_found";
            }
            return signatureStatus.value.err ? "failed" : "confirmed";
        }
        catch (error) {
            throw new Error(`Failed to get transaction status: ${error.message}`);
        }
    }
    // Request airdrop for new wallets (devnet only)
    // async requestAirdrop(
    //   walletAddress: string,
    //   amount: number = 1
    // ): Promise<string> {
    //   try {
    //     const pubKey = new PublicKey(walletAddress);
    //     const signature = await this.connection.requestAirdrop(
    //       pubKey,
    //       amount * LAMPORTS_PER_SOL
    //     );
    //     await this.connection.confirmTransaction(signature);
    //     return signature;
    //   } catch (error) {
    //     throw new Error(`Failed to request airdrop: ${(error as Error).message}`);
    //   }
    // }
    async getTransactionHistory(walletAddress, limit = 10, offset = 0) {
        try {
            const pubKey = new web3_js_1.PublicKey(walletAddress);
            const signatures = await this.connection.getSignaturesForAddress(pubKey, {
                limit: limit + offset,
            });
            const paginatedSignatures = signatures.slice(offset, offset + limit);
            const transactions = await Promise.all(paginatedSignatures.map(async (sig) => {
                try {
                    const tx = await this.connection.getTransaction(sig.signature);
                    if (!tx || !tx.meta)
                        return null;
                    const isReceiver = tx.meta.postBalances[0] > tx.meta.preBalances[0];
                    const amount = Math.abs(tx.meta.postBalances[0] - tx.meta.preBalances[0]) /
                        web3_js_1.LAMPORTS_PER_SOL;
                    return {
                        signature: sig.signature,
                        type: isReceiver ? "receive" : "send",
                        amount,
                        otherPartyAddress: isReceiver
                            ? tx.transaction.message.accountKeys[0].toString()
                            : tx.transaction.message.accountKeys[1].toString(),
                        timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
                        status: tx.meta.err ? "failed" : "confirmed",
                    };
                }
                catch (_a) {
                    return null;
                }
            }));
            return transactions.filter((tx) => tx !== null);
        }
        catch (error) {
            throw new Error(`Failed to get transaction history: ${error.message}`);
        }
    }
    async createTokenAccount(walletAddress, payerPrivateKey) {
        try {
            const walletPubKey = new web3_js_1.PublicKey(walletAddress);
            const payerKeypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(payerPrivateKey));
            // Get the associated token account address
            const tokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(this.soincMint, walletPubKey, false, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
            // Check if the token account already exists
            const account = await this.connection.getAccountInfo(tokenAccount);
            if (account !== null) {
                // Token account already exists
                return {
                    address: tokenAccount.toString(),
                    created: false,
                };
            }
            // Create a transaction to create the associated token account
            const transaction = new web3_js_1.Transaction().add((0, spl_token_1.createAssociatedTokenAccountInstruction)(payerKeypair.publicKey, // Payer
            tokenAccount, // Associated token account address
            walletPubKey, // Owner
            this.soincMint, // Mint
            spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
            // Get recent blockhash
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = payerKeypair.publicKey;
            // Sign and send transaction
            transaction.sign(payerKeypair);
            const signature = await this.connection.sendRawTransaction(transaction.serialize());
            // Wait for confirmation
            await this.connection.confirmTransaction(signature);
            return {
                address: tokenAccount.toString(),
                created: true,
            };
        }
        catch (error) {
            throw new Error(`Failed to create associated token account: ${error.message}`);
        }
    }
    /**
     * Create a token account for an external wallet (like Civic Auth wallet)
     * @param walletAddress The external wallet's public key
     */
    async createTokenAccountForExternalWallet(walletAddress) {
        try {
            // Validate wallet address
            const publicKey = new web3_js_1.PublicKey(walletAddress);
            // Use your app's fee payer wallet - get from environment variables
            const feePayerPrivateKey = process.env.FEE_PAYER_PRIVATE_KEY;
            if (!feePayerPrivateKey) {
                throw new Error("Fee payer private key not found in environment variables");
            }
            const feePayer = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(feePayerPrivateKey));
            // Get the associated token account address
            const tokenAccountAddress = await (0, spl_token_1.getAssociatedTokenAddress)(this.soincMint, publicKey, false, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
            // Check if the token account already exists
            const account = await this.connection.getAccountInfo(tokenAccountAddress);
            if (account !== null) {
                // Token account already exists
                return {
                    tokenAccount: tokenAccountAddress.toString(),
                    tokenAccountCreated: false,
                    tokenAccountTxSignature: null,
                };
            }
            // Get a fresh blockhash for the token account transaction
            const { blockhash: tokenBlockhash, lastValidBlockHeight: tokenLastValidBlockHeight, } = await this.connection.getLatestBlockhash();
            // Create a transaction to create the associated token account
            const tokenAccountTx = new web3_js_1.Transaction().add((0, spl_token_1.createAssociatedTokenAccountInstruction)(feePayer.publicKey, // Payer
            tokenAccountAddress, // Associated token account address
            publicKey, // Owner
            this.soincMint, // Mint
            spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
            tokenAccountTx.recentBlockhash = tokenBlockhash;
            tokenAccountTx.feePayer = feePayer.publicKey;
            // Sign and immediately send token account transaction
            tokenAccountTx.sign(feePayer);
            const tokenAccountTxSignature = await this.connection.sendRawTransaction(tokenAccountTx.serialize());
            // Wait for confirmation with explicit blocking
            await this.connection.confirmTransaction({
                signature: tokenAccountTxSignature,
                blockhash: tokenBlockhash,
                lastValidBlockHeight: tokenLastValidBlockHeight,
            });
            return {
                tokenAccount: tokenAccountAddress.toString(),
                tokenAccountCreated: true,
                tokenAccountTxSignature,
            };
        }
        catch (error) {
            console.error("Error creating token account for external wallet:", error);
            return {
                tokenAccount: null,
                tokenAccountCreated: false,
                tokenAccountTxSignature: null,
            };
        }
    }
}
exports.default = new SolanaService();
