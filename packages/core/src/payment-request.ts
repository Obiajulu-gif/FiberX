/**
 * FiberX payment-request codec.
 *
 * A "payment request" is a small, self-describing envelope around a Fiber
 * invoice so that apps can pass around a single string that carries the
 * invoice plus display metadata (amount, currency, description, expiry).
 *
 * Encoding: `fiber:` + base64url(JSON).
 * Decoding also accepts a raw invoice string (anything not starting with the
 * `fiber:` prefix is treated as a bare invoice).
 */

import { z } from "zod";
import { FiberInvalidPaymentRequestError } from "./errors.js";
import type { FiberPaymentRequest } from "./types.js";

export const PAYMENT_REQUEST_PREFIX = "fiber:";
export const PAYMENT_REQUEST_VERSION = "0.1";

const currencySchema = z.object({
  code: z.string().min(1),
  displayName: z.string().optional(),
  decimals: z.number().int().nonnegative().optional(),
  udtTypeScript: z.unknown().optional(),
});

const networkSchema = z.enum(["mainnet", "testnet", "devnet", "mock"]);

export const paymentRequestSchema = z.object({
  type: z.literal("fiber-payment-request"),
  version: z.string().min(1),
  network: networkSchema,
  invoice: z.string().min(1),
  amount: z.string().optional(),
  currency: currencySchema.optional(),
  description: z.string().optional(),
  expiresAt: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/* ---- base64url helpers (isomorphic) ---------------------------------- */

function toBase64Url(input: string): string {
  const bytes =
    typeof Buffer !== "undefined"
      ? Buffer.from(input, "utf-8").toString("base64")
      : btoa(unescape(encodeURIComponent(input)));
  return bytes.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const padded = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf-8");
  }
  return decodeURIComponent(escape(atob(padded)));
}

/**
 * Encode a payment request into a `fiber:` URI string.
 * The input is validated (and defaulted) before encoding.
 */
export function encodeFiberPaymentRequest(
  request: Partial<FiberPaymentRequest> & { invoice: string },
): string {
  const candidate: FiberPaymentRequest = {
    type: "fiber-payment-request",
    version: request.version ?? PAYMENT_REQUEST_VERSION,
    network: request.network ?? "testnet",
    invoice: request.invoice,
    amount: request.amount,
    currency: request.currency,
    description: request.description,
    expiresAt: request.expiresAt,
    metadata: request.metadata,
  };

  const parsed = paymentRequestSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new FiberInvalidPaymentRequestError(
      "Cannot encode invalid Fiber payment request.",
      parsed.error.flatten(),
    );
  }

  const json = JSON.stringify(parsed.data);
  return PAYMENT_REQUEST_PREFIX + toBase64Url(json);
}

/**
 * Parse either a `fiber:` encoded payment request or a bare invoice string.
 *
 * - `fiber:...`  -> decoded + validated FiberPaymentRequest
 * - anything else -> treated as a raw invoice, wrapped into a minimal request
 */
export function parseFiberPaymentRequest(input: string): FiberPaymentRequest {
  if (typeof input !== "string" || input.trim() === "") {
    throw new FiberInvalidPaymentRequestError(
      "Payment request input must be a non-empty string.",
    );
  }

  const value = input.trim();

  if (!value.startsWith(PAYMENT_REQUEST_PREFIX)) {
    // Treat as a raw invoice string.
    return {
      type: "fiber-payment-request",
      version: PAYMENT_REQUEST_VERSION,
      network: "testnet",
      invoice: value,
    };
  }

  const encoded = value.slice(PAYMENT_REQUEST_PREFIX.length);
  let jsonText: string;
  try {
    jsonText = fromBase64Url(encoded);
  } catch (err) {
    throw new FiberInvalidPaymentRequestError(
      "Payment request is not valid base64url.",
      err,
    );
  }

  let obj: unknown;
  try {
    obj = JSON.parse(jsonText);
  } catch (err) {
    throw new FiberInvalidPaymentRequestError(
      "Payment request does not contain valid JSON.",
      err,
    );
  }

  const parsed = paymentRequestSchema.safeParse(obj);
  if (!parsed.success) {
    throw new FiberInvalidPaymentRequestError(
      "Payment request failed schema validation.",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}

/** Return true when the input string is a `fiber:` encoded request. */
export function isEncodedPaymentRequest(input: string): boolean {
  return (
    typeof input === "string" && input.startsWith(PAYMENT_REQUEST_PREFIX)
  );
}
