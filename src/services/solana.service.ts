import {
  Connection,
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  Keypair,
  Commitment,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";
import User from "../models/User";
import { TransactionHistoryItem } from "../interfaces/transaction.interface";
import * as dotenv from "dotenv";
dotenv.config();

class SolanaService {
  private connection: Connection;
  private soincMint: PublicKey;
  private readonly SOINC_DECIMALS = 9;

  constructor() {
    const commitment: Commitment = "processed";
    this.connection = new Connection("https://api.mainnet-beta.solana.com", {
      commitment,
      wsEndpoint: "wss://api.mainnet-beta.solana.com",
    });

    this.soincMint = new PublicKey(
      "SonicxvLud67EceaEzCLRnMTBqzYUUYNr93DBkBdDES"
    );
  }

  // Create a new wallet for user
  async createWallet(solAmount = 0.002039): Promise<{
    publicKey: string;
    privateKey: string;
    tokenAccount: string;
    tokenAccountCreated: boolean;
    solTransferred: number;
    fundingTxSignature: string;
    tokenAccountTxSignature: string;
  }> {
    try {
      // Get the funder private key from environment variable
      const funderPrivateKey = process.env.WALLET_FUNDER_PRIVATE_KEY;
      if (!funderPrivateKey) {
        throw new Error(
          "Funder wallet private key not found in environment variables (WALLET_FUNDER_PRIVATE_KEY)"
        );
      }
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toString();
      const privateKey = bs58.encode(keypair.secretKey);

      const funder = Keypair.fromSecretKey(bs58.decode(funderPrivateKey));

      // Get the associated token account address
      const tokenAccountAddress = await getAssociatedTokenAddress(
        this.soincMint,
        keypair.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Check funder SOL balance to ensure it has enough
      const funderBalance = await this.connection.getBalance(funder.publicKey);
      const minimumAmount = solAmount * LAMPORTS_PER_SOL;
      if (funderBalance < minimumAmount + 5000) {
        // Add buffer for transaction fees
        throw new Error(
          `Funder wallet has insufficient SOL. Current balance: ${
            funderBalance / LAMPORTS_PER_SOL
          } SOL`
        );
      }

      // Get a fresh blockhash right before transaction
      const { blockhash: fundingBlockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash();

      // 1. First transfer minimum SOL to the new wallet
      const fundingTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: funder.publicKey,
          toPubkey: keypair.publicKey,
          lamports: Math.floor(minimumAmount),
        })
      );

      fundingTx.recentBlockhash = fundingBlockhash;
      fundingTx.feePayer = funder.publicKey;

      // Sign and immediately send funding transaction
      fundingTx.sign(funder);
      const fundingTxSignature = await this.connection.sendRawTransaction(
        fundingTx.serialize()
      );

      // Wait for confirmation with explicit blocking
      await this.connection.confirmTransaction({
        signature: fundingTxSignature,
        blockhash: fundingBlockhash,
        lastValidBlockHeight: lastValidBlockHeight,
      });

      // Add a small delay before creating token account
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get a fresh blockhash for the token account transaction
      const {
        blockhash: tokenBlockhash,
        lastValidBlockHeight: tokenLastValidBlockHeight,
      } = await this.connection.getLatestBlockhash();

      // 2. Now create the token account - funder will pay for this transaction
      const tokenAccountTx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          funder.publicKey, // Payer
          tokenAccountAddress, // Associated token account address
          keypair.publicKey, // Owner
          this.soincMint, // Mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      tokenAccountTx.recentBlockhash = tokenBlockhash;
      tokenAccountTx.feePayer = funder.publicKey;

      // Sign and immediately send token account transaction
      tokenAccountTx.sign(funder);
      const tokenAccountTxSignature = await this.connection.sendRawTransaction(
        tokenAccountTx.serialize()
      );

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
    } catch (error) {
      console.error("Wallet creation error:", error);
      throw new Error(
        `Failed to create wallet and token account: ${(error as Error).message}`
      );
    }
  }
  /**
   * Get token balance for a wallet address
   */

  async getTokenBalance(walletAddress: string): Promise<number> {
    try {
      const owner = new PublicKey(walletAddress);

      // Get the associated token account
      const tokenAccount = await getAssociatedTokenAddress(
        this.soincMint,
        owner,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const tokenBalance = await this.connection.getTokenAccountBalance(
        tokenAccount
      );
      return (
        Number(tokenBalance.value.amount) /
        Math.pow(10, tokenBalance.value.decimals)
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("account not found")
      ) {
        // Return 0 if token account doesn't exist yet
        return 0;
      }
      throw new Error(
        `Failed to get token balance:${(error as Error).message}`
      );
    }
  }

  async createAssociatedTokenAccount(
    walletAddress: string,
    payerPrivateKey: string
  ): Promise<{ address: string; created: boolean }> {
    try {
      const walletPubKey = new PublicKey(walletAddress);
      const payerKeypair = Keypair.fromSecretKey(bs58.decode(payerPrivateKey));

      // Get the associated token account address
      const tokenAccount = await getAssociatedTokenAddress(
        this.soincMint,
        walletPubKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

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
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          payerKeypair.publicKey, // Payer
          tokenAccount, // Associated token account address
          walletPubKey, // Owner
          this.soincMint, // Mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payerKeypair.publicKey;

      // Sign and send transaction
      transaction.sign(payerKeypair);
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      );

      // Wait for confirmation
      await this.connection.confirmTransaction(signature);

      return {
        address: tokenAccount.toString(),
        created: true,
      };
    } catch (error) {
      throw new Error(
        `Failed to create associated token account: ${(error as Error).message}`
      );
    }
  }

  async checkTokenAccount(walletAddress: string): Promise<{
    exists: boolean;
    address: string;
  }> {
    try {
      const owner = new PublicKey(walletAddress);
      const tokenAccount = await getAssociatedTokenAddress(
        this.soincMint,
        owner,
        false
      );
      const account = await this.connection.getAccountInfo(tokenAccount);

      return {
        exists: account !== null,
        address: tokenAccount.toString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to check token account: ${(error as Error).message}`
      );
    }
  }

  async getOrCreateAssociatedTokenAccount(walletAddress: string) {
    try {
      const owner = new PublicKey(walletAddress);
      const tokenAccount = await getAssociatedTokenAddress(
        this.soincMint,
        owner,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const account = await this.connection.getAccountInfo(tokenAccount);
      return {
        address: tokenAccount.toString(),
        exists: account !== null,
      };
    } catch (error) {
      throw new Error(
        `Failed to check token account: ${(error as Error).message}`
      );
    }
  }

  async sendTransaction(
    fromPrivateKey: string,
    toWallet: string,
    amount: number
  ): Promise<string> {
    try {
      console.log(
        `Transaction request: Sending ${amount} SOINC tokens to ${toWallet}`
      );

      // Your validation code...

      const fromKeypair = Keypair.fromSecretKey(bs58.decode(fromPrivateKey));
      const toPublicKey = new PublicKey(toWallet);

      // Get token accounts
      const fromTokenAccount = await getAssociatedTokenAddress(
        this.soincMint,
        fromKeypair.publicKey,
        false
      );

      // Check if destination has a token account
      const toTokenAccount = await getAssociatedTokenAddress(
        this.soincMint,
        toPublicKey,
        false
      );

      // Check if destination token account exists
      const destAccount = await this.connection.getAccountInfo(toTokenAccount);
      if (!destAccount) {
        console.log(
          "Destination token account doesn't exist, will need to create it"
        );
        // This would require additional SOL for rent
      }

      // Convert amount to token units using the correct decimal places
      const tokenAmount = Math.round(
        amount * Math.pow(10, this.SOINC_DECIMALS)
      );

      // Create token transfer instruction
      const transferInstruction = createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromKeypair.publicKey,
        tokenAmount,
        [],
        TOKEN_PROGRAM_ID
      );

      const transaction = new Transaction().add(transferInstruction);

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromKeypair.publicKey;

      // Sign and send transaction
      transaction.sign(fromKeypair);
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      );

      // Wait for confirmation
      await this.connection.confirmTransaction(signature);

      return signature;
    } catch (error) {
      console.error("Transaction error details:", error);
      throw new Error(
        `Failed to send transaction: ${(error as Error).message}`
      );
    }
  }
  async getBalance(walletAddress: string): Promise<number> {
    try {
      const pubKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(pubKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      throw new Error(`Failed to get balance: ${(error as Error).message}`);
    }
  }

  async getTransactionStatus(
    signature: string
  ): Promise<"confirmed" | "failed" | "not_found"> {
    try {
      const signatureStatus = await this.connection.getSignatureStatus(
        signature
      );

      if (!signatureStatus || !signatureStatus.value) {
        return "not_found";
      }

      return signatureStatus.value.err ? "failed" : "confirmed";
    } catch (error) {
      throw new Error(
        `Failed to get transaction status: ${(error as Error).message}`
      );
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

  async getTransactionHistory(
    walletAddress: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<TransactionHistoryItem[]> {
    try {
      const pubKey = new PublicKey(walletAddress);
      const signatures = await this.connection.getSignaturesForAddress(pubKey, {
        limit: limit + offset,
      });

      const paginatedSignatures = signatures.slice(offset, offset + limit);

      const transactions = await Promise.all(
        paginatedSignatures.map(async (sig) => {
          try {
            const tx = await this.connection.getTransaction(sig.signature);
            if (!tx || !tx.meta) return null;

            const isReceiver = tx.meta.postBalances[0] > tx.meta.preBalances[0];
            const amount =
              Math.abs(tx.meta.postBalances[0] - tx.meta.preBalances[0]) /
              LAMPORTS_PER_SOL;

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
          } catch {
            return null;
          }
        })
      );

      return transactions.filter(
        (tx): tx is TransactionHistoryItem => tx !== null
      );
    } catch (error) {
      throw new Error(
        `Failed to get transaction history: ${(error as Error).message}`
      );
    }
  }

  async createTokenAccount(
    walletAddress: string,
    payerPrivateKey: string
  ): Promise<{ address: string; created: boolean }> {
    try {
      const walletPubKey = new PublicKey(walletAddress);
      const payerKeypair = Keypair.fromSecretKey(bs58.decode(payerPrivateKey));

      // Get the associated token account address
      const tokenAccount = await getAssociatedTokenAddress(
        this.soincMint,
        walletPubKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

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
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          payerKeypair.publicKey, // Payer
          tokenAccount, // Associated token account address
          walletPubKey, // Owner
          this.soincMint, // Mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payerKeypair.publicKey;

      // Sign and send transaction
      transaction.sign(payerKeypair);
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      );

      // Wait for confirmation
      await this.connection.confirmTransaction(signature);

      return {
        address: tokenAccount.toString(),
        created: true,
      };
    } catch (error) {
      throw new Error(
        `Failed to create associated token account: ${(error as Error).message}`
      );
    }
  }
  /**
   * Create a token account for an external wallet (like Civic Auth wallet)
   * @param walletAddress The external wallet's public key
   */
  async createTokenAccountForExternalWallet(walletAddress: string): Promise<{
    tokenAccount: string | null;
    tokenAccountCreated: boolean;
    tokenAccountTxSignature: string | null;
  }> {
    try {
      // Validate wallet address
      const publicKey = new PublicKey(walletAddress);

      // Use your app's fee payer wallet - get from environment variables
      const feePayerPrivateKey = process.env.FEE_PAYER_PRIVATE_KEY;
      if (!feePayerPrivateKey) {
        throw new Error(
          "Fee payer private key not found in environment variables"
        );
      }

      const feePayer = Keypair.fromSecretKey(bs58.decode(feePayerPrivateKey));

      // Get the associated token account address
      const tokenAccountAddress = await getAssociatedTokenAddress(
        this.soincMint,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

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
      const {
        blockhash: tokenBlockhash,
        lastValidBlockHeight: tokenLastValidBlockHeight,
      } = await this.connection.getLatestBlockhash();

      // Create a transaction to create the associated token account
      const tokenAccountTx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          feePayer.publicKey, // Payer
          tokenAccountAddress, // Associated token account address
          publicKey, // Owner
          this.soincMint, // Mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      tokenAccountTx.recentBlockhash = tokenBlockhash;
      tokenAccountTx.feePayer = feePayer.publicKey;

      // Sign and immediately send token account transaction
      tokenAccountTx.sign(feePayer);
      const tokenAccountTxSignature = await this.connection.sendRawTransaction(
        tokenAccountTx.serialize()
      );

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
    } catch (error) {
      console.error("Error creating token account for external wallet:", error);
      return {
        tokenAccount: null,
        tokenAccountCreated: false,
        tokenAccountTxSignature: null,
      };
    }
  }
}

export default new SolanaService();
