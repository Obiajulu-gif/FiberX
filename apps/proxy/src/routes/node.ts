import type { FastifyInstance } from "fastify";
import type { FiberService } from "../fiber-rpc-client.js";

export async function nodeRoutes(
  fastify: FastifyInstance,
  service: FiberService,
): Promise<void> {
  fastify.get("/api/node-info", async () => {
    const provider = await service.ready();
    const info = await provider.getInfo();
    return {
      pubkey: info.pubkey,
      nodeName: info.nodeName,
      version: info.version,
      network: info.network,
      addresses: info.addresses,
      channelCount: info.channelCount,
      pendingChannelCount: info.pendingChannelCount,
      peersCount: info.peersCount,
      features: info.features,
    };
  });
}
