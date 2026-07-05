import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { FiberService } from "../fiber-rpc-client.js";
import { sendValidationError } from "../http.js";

const currencySchema = z.object({
  code: z.string().min(1),
  displayName: z.string().optional(),
  decimals: z.number().int().nonnegative().optional(),
  udtTypeScript: z.unknown().optional(),
});

const makeInvoiceSchema = z.object({
  amount: z.string().min(1),
  currency: currencySchema,
  description: z.string().optional(),
  expirySeconds: z.number().int().positive().optional(),
  paymentPreimage: z.string().optional(),
  paymentHash: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const parseInvoiceSchema = z.object({
  invoice: z.string().min(1),
});

export async function invoiceRoutes(
  fastify: FastifyInstance,
  service: FiberService,
): Promise<void> {
  fastify.post("/api/invoices", async (request, reply) => {
    const parsed = makeInvoiceSchema.safeParse(request.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);

    const provider = await service.ready();
    const result = await provider.makeInvoice(parsed.data);
    return {
      invoiceAddress: result.invoiceAddress,
      paymentHash: result.paymentHash,
      status: result.status ?? "Open",
    };
  });

  fastify.post("/api/invoices/parse", async (request, reply) => {
    const parsed = parseInvoiceSchema.safeParse(request.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);

    const provider = await service.ready();
    const result = await provider.parseInvoice(parsed.data.invoice);
    return {
      invoiceAddress: result.invoiceAddress,
      amount: result.amount,
      currency: result.currency,
      description: result.description,
      paymentHash: result.paymentHash,
      expiresAt: result.expiresAt,
      payeePubkey: result.payeePubkey,
    };
  });

  fastify.get("/api/invoices/:paymentHash", async (request) => {
    const { paymentHash } = request.params as { paymentHash: string };
    const provider = await service.ready();
    return provider.getInvoice(paymentHash);
  });
}
