/**
 * FiberX proxy entry point.
 *
 * Builds a Fastify server exposing a curated REST API in front of a Fiber
 * Network Node (or the in-memory mock). See `security.ts` for the allow-list.
 */

import Fastify, {
  type FastifyError,
  type FastifyInstance,
} from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { FiberConnectError } from "@fiberx/core";
import { loadConfig, type ProxyConfig } from "./config.js";
import { FiberService } from "./fiber-rpc-client.js";
import { makeApiKeyGuard } from "./security.js";
import { healthRoutes } from "./routes/health.js";
import { nodeRoutes } from "./routes/node.js";
import { channelRoutes } from "./routes/channels.js";
import { invoiceRoutes } from "./routes/invoices.js";
import { readinessRoutes } from "./routes/readiness.js";
import { paymentRoutes } from "./routes/payments.js";

export async function buildServer(
  overrides: Partial<ProxyConfig> = {},
): Promise<FastifyInstance> {
  const config = loadConfig(overrides);
  const app = Fastify({
    logger: { level: config.logLevel },
  });

  await app.register(cors, {
    origin: config.corsOrigin === "*" ? true : config.corsOrigin,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["content-type", "x-fiber-connect-key", "accept"],
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    allowList: () => false,
  });

  const service = new FiberService(config);

  // Public health check (no auth).
  await app.register(async (instance) => {
    await healthRoutes(instance, service);
  });

  // Authenticated API surface.
  await app.register(async (instance) => {
    instance.addHook("preHandler", makeApiKeyGuard(config));
    await nodeRoutes(instance, service);
    await channelRoutes(instance, service);
    await invoiceRoutes(instance, service);
    await readinessRoutes(instance, service);
    await paymentRoutes(instance, service);
  });

  // Uniform error shape.
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof FiberConnectError) {
      reply.code(502).send({
        ok: false,
        error: error.code,
        message: error.message,
      });
      return;
    }
    if (error.statusCode === 429) {
      reply.code(429).send({
        ok: false,
        error: "rate_limited",
        message: "Too many requests. Please slow down.",
      });
      return;
    }
    app.log.error(error);
    reply.code(error.statusCode ?? 500).send({
      ok: false,
      error: "internal_error",
      message: error.message ?? "Unexpected proxy error.",
    });
  });

  return app;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildServer();
  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
    app.log.info(
      `FiberX proxy listening on http://localhost:${config.port} (mode=${config.mode})`,
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Only auto-start when run directly (not when imported by tests).
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("index.ts") || process.argv[1].endsWith("index.js"));
if (isDirectRun) {
  void main();
}
