export interface WalletBalance {
  balance: number;
  bonus: number;
}

export interface TokenPackage {
  id: string;
  delts: number;
  bonusDelts: number;
  priceUsdCents: number;
  popular?: boolean;
}

export type TransactionKind =
  | 'purchase'
  | 'super_like'
  | 'boost'
  | 'priority_match'
  | 'live_session'
  | 'bonus';

export interface Transaction {
  id: string;
  kind: TransactionKind;
  delts: number;        // signed: +purchase, -spend
  description: string;
  occurredAt: string;   // ISO
}
