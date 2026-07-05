/**
 * Proxy security: API-key auth + the allow-list of permitted RPC operations.
 *
 * The proxy deliberately exposes only a curated REST surface. There is NO
 * arbitrary JSON-RPC passthrough, no private-key signing, and no dev/admin
 * methods. This list documents exactly what the proxy is willing to do.
 */

import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProxyConfig } from "./config.js";

export const API_KEY_HEADER = "x-fiber-connect-key";

/** The only Fiber RPC operations this proxy will ever perform. */
export const ALLOWED_RPC_OPERATIONS = [
  "node_info",
  "list_channels",
  "new_invoice",
  "parse_invoice",
  "get_invoice",
  "send_payment",
  "get_payment",
  "list_payments",
] as const;

export type AllowedRpcOperation = (typeof ALLOWED_RPC_OPERATIONS)[number];

export function isAllowedRpcOperation(op: string): op is AllowedRpcOperation {
  return (ALLOWED_RPC_OPERATIONS as readonly string[]).includes(op);
}

/**
 * Fastify preHandler that enforces the shared API key on all /api/* routes.
 */
export function makeApiKeyGuard(config: ProxyConfig) {
  return async function apiKeyGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const provided = request.headers[API_KEY_HEADER];
    if (!provided || provided !== config.apiKey) {
      reply.code(401).send({
        ok: false,
        error: "unauthorized",
        message: `Missing or invalid ${API_KEY_HEADER} header.`,
      });
    }
  };
}
