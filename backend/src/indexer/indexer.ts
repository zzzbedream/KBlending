import { Interface, type LogDescription } from "ethers";
import { config, isChainConfigured } from "../config.js";
import { provider } from "../chain/provider.js";
import { VAULT_ABI } from "../abi.js";
import { logger } from "../logger.js";
import type { EventRepository } from "../store/repository.js";
import type { VaultEvent, VaultEventType } from "../types.js";

// event name -> which arg holds the acting wallet / the amount
const ACTOR_ARG: Record<VaultEventType, string> = {
  Supplied: "user",
  SupplyWithdrawn: "user",
  CollateralDeposited: "user",
  CollateralWithdrawn: "user",
  Borrowed: "user",
  Repaid: "payer",
  Liquidated: "liquidator",
};
const AMOUNT_ARG: Record<VaultEventType, string> = {
  Supplied: "amount",
  SupplyWithdrawn: "amount",
  CollateralDeposited: "amount",
  CollateralWithdrawn: "amount",
  Borrowed: "amount",
  Repaid: "amount",
  Liquidated: "repaidAmount",
};

function isVaultEventType(name: string): name is VaultEventType {
  return name in ACTOR_ARG;
}

export class Indexer {
  private readonly iface = new Interface(VAULT_ABI);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly repo: EventRepository) {}

  async start(): Promise<void> {
    if (!isChainConfigured()) {
      logger.warn("VAULT_ADDRESS not set — indexer idle. Set it in .env to index events.");
      return;
    }
    this.repo.setLastIndexedBlock(Math.max(config.startBlock - 1, 0));
    await this.sync();
    this.timer = setInterval(() => void this.sync(), config.pollIntervalMs);
    logger.info(`Indexer polling every ${config.pollIntervalMs}ms for ${config.vaultAddress}`);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async sync(): Promise<void> {
    try {
      const latest = await provider().getBlockNumber();
      let from = this.repo.lastIndexedBlock() + 1;
      while (from <= latest) {
        const to = Math.min(from + config.logChunkSize - 1, latest);
        await this.indexRange(from, to);
        this.repo.setLastIndexedBlock(to);
        from = to + 1;
      }
    } catch (e) {
      logger.error("Indexer sync failed", e instanceof Error ? e.message : e);
    }
  }

  private async indexRange(from: number, to: number): Promise<void> {
    const logs = await provider().getLogs({ address: config.vaultAddress, fromBlock: from, toBlock: to });
    if (logs.length === 0) return;

    const timestamps = await this.blockTimestamps(logs.map((l) => l.blockNumber));
    const events: VaultEvent[] = [];
    for (const log of logs) {
      let parsed: LogDescription | null;
      try {
        parsed = this.iface.parseLog({ topics: [...log.topics], data: log.data });
      } catch {
        continue; // not one of our known events
      }
      if (!parsed || !isVaultEventType(parsed.name)) continue;

      const type = parsed.name;
      events.push({
        type,
        user: String(parsed.args[ACTOR_ARG[type]]),
        amount: (parsed.args[AMOUNT_ARG[type]] as bigint).toString(),
        blockNumber: log.blockNumber,
        timestamp: timestamps.get(log.blockNumber) ?? Math.floor(Date.now() / 1000),
        txHash: log.transactionHash,
        logIndex: log.index,
      });
    }
    this.repo.add(events);
    if (events.length > 0) logger.info(`Indexed ${events.length} event(s) in blocks ${from}-${to}`);
  }

  private async blockTimestamps(blockNumbers: number[]): Promise<Map<number, number>> {
    const unique = [...new Set(blockNumbers)];
    const entries = await Promise.all(
      unique.map(async (bn): Promise<[number, number]> => {
        const block = await provider().getBlock(bn);
        return [bn, block ? Number(block.timestamp) : Math.floor(Date.now() / 1000)];
      }),
    );
    return new Map(entries);
  }
}
