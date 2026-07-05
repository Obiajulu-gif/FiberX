import type { FastifyInstance } from "fastify";
import type { FiberService } from "../fiber-rpc-client.js";

export async function healthRoutes(
  fastify: FastifyInstance,
  service: FiberService,
): Promise<void> {
  fastify.get("/health", async () => {
    return {
      ok: true,
      mode: service.mode,
      service: "fiber-connect-proxy",
    };
  });
}
