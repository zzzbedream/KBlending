/** A user action indexed from the vault's events. */
export type VaultEventType =
  | "Supplied"
  | "SupplyWithdrawn"
  | "CollateralDeposited"
  | "CollateralWithdrawn"
  | "Borrowed"
  | "Repaid"
  | "Liquidated";

export type VaultEvent = {
  type: VaultEventType;
  /** The acting/subject wallet (payer for Repaid, liquidator for Liquidated). */
  user: string;
  /** Amount in the relevant token's smallest unit, as a decimal string (bigint-safe JSON). */
  amount: string;
  blockNumber: number;
  timestamp: number; // unix seconds
  txHash: string;
  logIndex: number;
};

export type WeeklyActiveWallets = {
  week: string; // ISO week, e.g. "2026-W28"
  wallets: number;
};

export type StatsSummary = {
  totalEvents: number;
  uniqueWallets: number;
  byType: Record<VaultEventType, number>;
};
