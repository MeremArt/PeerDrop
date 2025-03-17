export interface TransactionHistoryItem {
  signature: string;
  type: "send" | "receive";
  amount: number;
  otherPartyAddress: string;
  timestamp: number;
  status: "confirmed" | "failed";
}

export interface TransactionRequest {
  fromTiktok: string; // Changed from fromPhone
  toTiktok: string; // Changed from toPhone
  amount: number;
}
