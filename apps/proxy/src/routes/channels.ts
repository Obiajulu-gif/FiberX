import type { FastifyInstance } from "fastify";
import type { FiberService } from "../fiber-rpc-client.js";

export async function channelRoutes(
  fastify: FastifyInstance,
  service: FiberService,
): Promise<void> {
  fastify.get("/api/channels", async (request) => {
    const provider = await service.ready();
    const query = request.query as { peerPubkey?: string };
    const channels = await provider.listChannels({
      peerPubkey: query.peerPubkey,
    });
    return { channels };
  });

  fastify.get("/api/balance", async () => {
    const provider = await service.ready();
    return provider.getBalance();
  });
}
