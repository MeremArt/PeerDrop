"use strict";
// // src/controllers/sms.controller.ts
// import { Request, Response } from "express";
// import solanaService from "../services/solana.service";
// import userService from "../services/user.service";
// import smsService from "../services/sms.service";
// import { SMSCommand } from "../interfaces/sms.interface";
// export const processIncomingSMS = async (
//   req: Request<{}, {}, SMSCommand>,
//   res: Response
// ) => {
//   try {
//     const { from, text } = req.body;
//     console.log("Received message:", { from, text });
//     // Parse command
//     const commandRegex = /send\s+(\d+(?:\.\d+)?)\s+sol\s+to\s+(\d{10,13})/i;
//     const match = text.match(commandRegex);
//     if (!match) {
//       return res.status(400).json({ message: "Invalid command format" });
//     }
//     const amount = parseFloat(match[1]);
//     let recipientPhone = match[2];
//     // Convert phone numbers to international format
//     recipientPhone = smsService.toInternationalFormat(recipientPhone);
//     const senderPhone = smsService.toInternationalFormat(from);
//     // Get sender and receiver details
//     const sender = await userService.findByPhone(senderPhone);
//     const receiver = await userService.findByPhone(recipientPhone);
//     if (!sender || !receiver) {
//       const errorMsg = !sender
//         ? "Sender not registered"
//         : "Recipient not registered";
//       await smsService.sendSMS(senderPhone, errorMsg);
//       return res.status(404).json({ message: errorMsg });
//     }
//     // Check balance
//     const balance = await solanaService.getBalance(sender.walletAddress);
//     if (balance < amount) {
//       const errorMsg = `Insufficient balance. Available: ${balance} SOL`;
//       await smsService.sendSMS(senderPhone, errorMsg);
//       return res.status(400).json({ message: errorMsg });
//     }
//     // Send transaction
//     const signature = await solanaService.sendTransaction(
//       sender.privateKey,
//       receiver.walletAddress,
//       amount
//     );
//     // Send confirmation SMS
//     const confirmationMsg = `Transaction successful! Sent ${amount} SOL to ${recipientPhone}. Signature: ${signature.slice(
//       0,
//       8
//     )}...`;
//     await smsService.sendSMS(senderPhone, confirmationMsg);
//     // Send notification to recipient
//     const receiverMsg = `You received ${amount} SOL from ${senderPhone}`;
//     await smsService.sendSMS(recipientPhone, receiverMsg);
//     res.status(200).json({
//       message: "SMS processed and transaction completed",
//       signature,
//       from: {
//         phone: senderPhone,
//         wallet: sender.walletAddress,
//       },
//       to: {
//         phone: recipientPhone,
//         wallet: receiver.walletAddress,
//       },
//       amount,
//     });
//   } catch (error) {
//     console.error("Error processing SMS command:", error);
//     // Send error SMS if possible
//     try {
//       const senderPhone = smsService.toInternationalFormat(req.body.from);
//       await smsService.sendSMS(
//         senderPhone,
//         "Transaction failed. Please try again later."
//       );
//     } catch (smsError) {
//       console.error("Error sending failure SMS:", smsError);
//     }
//     res.status(500).json({
//       message: "Error processing transaction",
//       error: (error as Error).message,
//     });
//   }
// };
// export const processDeliveryReport = async (req: Request, res: Response) => {
//   try {
//     const data = req.body;
//     console.log("Received delivery report:", data);
//     // Store delivery status or handle as needed
//     res.sendStatus(200);
//   } catch (error) {
//     console.error("Error processing delivery report:", error);
//     res.status(500).json({ message: "Error processing delivery report" });
//   }
// };
