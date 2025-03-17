"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const bs58_1 = __importDefault(require("bs58"));
class SolanaService {
    constructor() {
        const commitment = "processed";
        this.connection = new web3_js_1.Connection("https://api.mainnet-beta.solana.com", {
            commitment,
            wsEndpoint: "wss://api.mainnet-beta.solana.com",
        });
        this.soincMint = new web3_js_1.PublicKey("SonicxvLud67EceaEzCLRnMTBqzYUUYNr93DBkBdDES");
    }
    // Create a new wallet for user
    async createWallet() {
        const keypair = web3_js_1.Keypair.generate();
        return {
            publicKey: keypair.publicKey.toString(),
            privateKey: bs58_1.default.encode(keypair.secretKey),
        };
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
            // Decode the private key from base58
            const decodedPrivateKey = bs58_1.default.decode(fromPrivateKey);
            const fromKeypair = web3_js_1.Keypair.fromSecretKey(decodedPrivateKey);
            const toPublicKey = new web3_js_1.PublicKey(toWallet);
            const fromTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(this.soincMint, fromKeypair.publicKey, true, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
            const toTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(this.soincMint, toPublicKey, true, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
            // Create token transfer instruction
            // Create token transfer instruction
            const transferInstruction = (0, spl_token_1.createTransferInstruction)(fromTokenAccount, // source
            toTokenAccount, // destination
            fromKeypair.publicKey, // owner
            amount * Math.pow(10, 6), // amount, assuming 6 decimals for USDC
            [], // multisigners
            spl_token_1.TOKEN_PROGRAM_ID // programId
            );
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
}
exports.default = new SolanaService();
