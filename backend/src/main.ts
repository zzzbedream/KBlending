import { config } from "./config.js";
import { logger } from "./logger.js";
import { MemoryStore } from "./store/memoryStore.js";
import { Indexer } from "./indexer/indexer.js";
import { buildServer } from "./server.js";

async function main(): Promise<void> {
  const repo = new MemoryStore();
  const indexer = new Indexer(repo);

  // Start indexing in the background; the API serves regardless of indexer state.
  void indexer.start();

  const app = await buildServer(repo);
  await app.listen({ port: config.port, host: "0.0.0.0" });
  logger.info(`KBlending API listening on http://localhost:${config.port}`);

  const shutdown = async () => {
    logger.info("Shutting down…");
    indexer.stop();
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => {
  logger.error("Fatal startup error", e instanceof Error ? e.message : e);
  process.exit(1);
});
