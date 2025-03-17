// import AfricasTalking from "africastalking";

// class SMSService {
//   private africasTalking;

//   constructor() {
//     this.africasTalking = AfricasTalking({
//       apiKey: process.env.AFRICAS_TALKING_API_KEY || "",
//       username: process.env.AFRICAS_TALKING_USERNAME || "sandbox",
//     });
//   }

//   async sendSMS(to: string, message: string, from?: string) {
//     try {
//       const result = await this.africasTalking.SMS.send({
//         to: [to],
//         message,
//         from: from || process.env.AFRICAS_TALKING_SENDER_ID || "80552",
//       });
//       return result;
//     } catch (error) {
//       throw new Error(`Failed to send SMS: ${(error as Error).message}`);
//     }
//   }

//   // Helper function to convert local phone numbers to international format
//   toInternationalFormat(phone: string): string {
//     if (phone.startsWith("0")) {
//       return "+234" + phone.slice(1);
//     }
//     if (!phone.startsWith("+")) {
//       return "+" + phone;
//     }
//     return phone;
//   }
// }

// export default new SMSService();
