import type { FastifyInstance } from "fastify";
import { isChainConfigured } from "../config.js";
import type { EventRepository } from "../store/repository.js";
import { getMarketSnapshot } from "../services/marketService.js";
import { getLiquidatablePositions, getPosition } from "../services/positionService.js";
import { computeWeeklyActiveWallets, summarize } from "../services/statsService.js";

const NOT_CONFIGURED = { error: "Chain not configured (set VAULT_ADDRESS)" };

export async function registerRoutes(app: FastifyInstance, repo: EventRepository): Promise<void> {
  app.get("/health", async () => ({
    status: "ok",
    chainConfigured: isChainConfigured(),
    indexedEvents: repo.size(),
    lastIndexedBlock: repo.lastIndexedBlock(),
  }));

  app.get("/api/market", async (_req, reply) => {
    if (!isChainConfigured()) return reply.code(503).send(NOT_CONFIGURED);
    try {
      return await getMarketSnapshot();
    } catch (e) {
      return reply.code(502).send({ error: "Failed to read market", detail: msg(e) });
    }
  });

  app.get<{ Params: { address: string } }>("/api/position/:address", async (req, reply) => {
    if (!isChainConfigured()) return reply.code(503).send(NOT_CONFIGURED);
    try {
      return await getPosition(req.params.address);
    } catch (e) {
      return reply.code(400).send({ error: "Invalid address or read failure", detail: msg(e) });
    }
  });

  app.get("/api/stats/wuaw", async () => ({ weeks: computeWeeklyActiveWallets(repo.all()) }));

  app.get("/api/stats/summary", async () => summarize(repo.all()));

  app.get<{ Querystring: { limit?: string } }>("/api/events", async (req) => {
    const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 500);
    return { events: repo.recent(limit) };
  });

  app.get("/api/liquidatable", async (_req, reply) => {
    if (!isChainConfigured()) return reply.code(503).send(NOT_CONFIGURED);
    try {
      return { positions: await getLiquidatablePositions(repo) };
    } catch (e) {
      return reply.code(502).send({ error: "Failed to scan positions", detail: msg(e) });
    }
  });
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
