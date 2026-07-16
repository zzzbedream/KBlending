import type { VaultEvent } from "../types.js";
import type { EventRepository } from "./repository.js";

/** In-memory event store. Dedupes by `${txHash}:${logIndex}`. */
export class MemoryStore implements EventRepository {
  private events: VaultEvent[] = [];
  private seen = new Set<string>();
  private borrowerSet = new Set<string>();
  private cursor = 0;

  add(events: VaultEvent[]): void {
    for (const e of events) {
      const key = `${e.txHash}:${e.logIndex}`;
      if (this.seen.has(key)) continue;
      this.seen.add(key);
      this.events.push(e);
      if (e.type === "Borrowed") this.borrowerSet.add(e.user.toLowerCase());
    }
    this.events.sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);
  }

  all(): VaultEvent[] {
    return this.events;
  }

  recent(limit: number): VaultEvent[] {
    return this.events.slice(-limit).reverse();
  }

  borrowers(): string[] {
    return [...this.borrowerSet];
  }

  lastIndexedBlock(): number {
    return this.cursor;
  }

  setLastIndexedBlock(block: number): void {
    this.cursor = block;
  }

  size(): number {
    return this.events.length;
  }
}
