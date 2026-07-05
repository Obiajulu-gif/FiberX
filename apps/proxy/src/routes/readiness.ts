import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { FiberService } from "../fiber-rpc-client.js";
import { sendValidationError } from "../http.js";

const canPaySchema = z.object({
  invoice: z.string().optional(),
  amount: z.string().optional(),
  currency: z
    .object({
      code: z.string().min(1),
      decimals: z.number().int().nonnegative().optional(),
    })
    .optional(),
  maxFeeAmount: z.string().optional(),
  timeoutSeconds: z.number().int().positive().optional(),
});

export async function readinessRoutes(
  fastify: FastifyInstance,
  service: FiberService,
): Promise<void> {
  fastify.post("/api/can-pay", async (request, reply) => {
    const parsed = canPaySchema.safeParse(request.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);

    const provider = await service.ready();
    const result = await provider.canPay(parsed.data);
    return result;
  });
}
