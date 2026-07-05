import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { FiberService } from "../fiber-rpc-client.js";
import { sendValidationError } from "../http.js";

const sendPaymentSchema = z.object({
  invoice: z.string().min(1),
  maxFeeAmount: z.string().optional(),
  maxFeeRate: z.number().optional(),
  timeoutSeconds: z.number().int().positive().optional(),
  dryRun: z.boolean().optional(),
});

export async function paymentRoutes(
  fastify: FastifyInstance,
  service: FiberService,
): Promise<void> {
  fastify.post("/api/payments/send", async (request, reply) => {
    const parsed = sendPaymentSchema.safeParse(request.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);

    const provider = await service.ready();
    const result = await provider.sendPayment(parsed.data);
    return {
      paymentHash: result.paymentHash,
      status: result.status,
      fee: result.fee,
      preimage: result.preimage,
      failedError: result.failedError,
    };
  });

  fastify.get("/api/payments/:paymentHash", async (request) => {
    const { paymentHash } = request.params as { paymentHash: string };
    const provider = await service.ready();
    const result = await provider.getPayment(paymentHash);
    return {
      paymentHash: result.paymentHash,
      status: result.status,
      fee: result.fee,
      preimage: result.preimage,
      failedError: result.failedError,
      createdAt: result.createdAt,
      lastUpdatedAt: result.lastUpdatedAt,
    };
  });
}
