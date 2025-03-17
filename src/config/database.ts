// src/db/connection.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MongoDB URI is not defined in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");

    // Drop the phoneNumber_1 index that's causing problems
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db
          .collection("users")
          .dropIndex("phoneNumber_1");
        console.log("Successfully dropped phoneNumber_1 index");
      } else {
        console.log("mongoose.connection.db is undefined");
      }
    } catch (err) {
      // This will happen if the index doesn't exist, which is fine
      console.log("Note: phoneNumber_1 index may have already been removed");
    }

    // Create indexes for the withdrawals collection
    try {
      if (mongoose.connection.db) {
        // Check if withdrawals collection exists
        const collections = await mongoose.connection.db
          .listCollections({ name: "withdrawals" })
          .toArray();

        if (collections.length === 0) {
          console.log("Creating withdrawals collection with indexes");

          // Create collection (will be automatically created when first document is inserted)
          // Create indexes manually
          await mongoose.connection.db.createCollection("withdrawals");

          // Create indexes for efficient querying
          await mongoose.connection.db
            .collection("withdrawals")
            .createIndex({ userId: 1, createdAt: -1 });
          await mongoose.connection.db
            .collection("withdrawals")
            .createIndex({ status: 1 });
          await mongoose.connection.db
            .collection("withdrawals")
            .createIndex({ transactionId: 1 }, { unique: true });
          await mongoose.connection.db
            .collection("withdrawals")
            .createIndex({ reference: 1 }, { sparse: true });

          console.log(
            "Successfully created indexes for withdrawals collection"
          );
        } else {
          console.log("Withdrawals collection already exists");
        }
      }
    } catch (err) {
      console.error("Error setting up withdrawals collection:", err);
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
