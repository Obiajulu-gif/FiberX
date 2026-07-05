/**
 * Small HTTP helpers shared by routes.
 */

import type { FastifyReply } from "fastify";
import type { ZodError } from "zod";

export function sendValidationError(
  reply: FastifyReply,
  error: ZodError,
): FastifyReply {
  return reply.code(400).send({
    ok: false,
    error: "invalid_request",
    message: "Request body failed validation.",
    details: error.flatten(),
  });
}
