import type { VaultEvent } from "../types.js";

/**
 * Storage abstraction for indexed events + indexer cursor.
 * The in-memory implementation is enough for the grant MVP; swap for Postgres
 * later without touching services or routes (Repository pattern).
 */
export interface EventRepository {
  add(events: VaultEvent[]): void;
  all(): VaultEvent[];
  recent(limit: number): VaultEvent[];
  /** Distinct wallet addresses that ever borrowed (candidates for liquidation checks). */
  borrowers(): string[];
  lastIndexedBlock(): number;
  setLastIndexedBlock(block: number): void;
  size(): number;
}
