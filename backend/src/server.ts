import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { registerRoutes } from "./routes/index.js";
import type { EventRepository } from "./store/repository.js";

export async function buildServer(repo: EventRepository): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",").map((o) => o.trim()),
  });

  await registerRoutes(app, repo);
  return app;
}
