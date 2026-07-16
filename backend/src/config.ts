import "dotenv/config";

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) throw new Error(`Env ${name} is not a number: ${raw}`);
  return parsed;
}

function str(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const config = {
  port: num("PORT", 4000),
  corsOrigin: str("CORS_ORIGIN", "*"),
  rpcUrl: str("RPC_URL", "https://rpc-testnet.bitkubchain.io"),
  chainId: num("CHAIN_ID", 25925),
  vaultAddress: str("VAULT_ADDRESS"),
  collateralAddress: str("COLLATERAL_ADDRESS"),
  borrowAddress: str("BORROW_ADDRESS"),
  startBlock: num("START_BLOCK", 0),
  pollIntervalMs: num("POLL_INTERVAL_MS", 15_000),
  logChunkSize: num("LOG_CHUNK_SIZE", 5_000),
} as const;

/** True once the vault address is configured; the indexer stays idle until then. */
export function isChainConfigured(): boolean {
  return config.vaultAddress !== "";
}
