import { describe, it, expect } from "vitest";
import {
  encodeFiberPaymentRequest,
  parseFiberPaymentRequest,
  isEncodedPaymentRequest,
  PAYMENT_REQUEST_PREFIX,
} from "../src/payment-request.js";
import { FiberInvalidPaymentRequestError } from "../src/errors.js";

describe("payment-request codec", () => {
  const base = {
    invoice: "fibt_mock_ckb_0001_abc123",
    network: "testnet" as const,
    amount: "100000000",
    currency: { code: "CKB", displayName: "CKB", decimals: 8 },
    description: "Demo payment",
    metadata: { orderId: "demo-001" },
  };

  it("encodes a request into a fiber: URI", () => {
    const encoded = encodeFiberPaymentRequest(base);
    expect(encoded.startsWith(PAYMENT_REQUEST_PREFIX)).toBe(true);
    expect(isEncodedPaymentRequest(encoded)).toBe(true);
  });

  it("round-trips encode -> parse", () => {
    const encoded = encodeFiberPaymentRequest(base);
    const parsed = parseFiberPaymentRequest(encoded);
    expect(parsed.type).toBe("fiber-payment-request");
    expect(parsed.invoice).toBe(base.invoice);
    expect(parsed.amount).toBe("100000000");
    expect(parsed.currency?.code).toBe("CKB");
    expect(parsed.metadata?.orderId).toBe("demo-001");
  });

  it("accepts a raw invoice string", () => {
    const parsed = parseFiberPaymentRequest("fibt_mock_ckb_0001_abc123");
    expect(parsed.invoice).toBe("fibt_mock_ckb_0001_abc123");
    expect(parsed.type).toBe("fiber-payment-request");
  });

  it("rejects an invalid encoded request", () => {
    // Valid base64url of JSON that fails schema (missing invoice).
    const bad =
      PAYMENT_REQUEST_PREFIX +
      Buffer.from(JSON.stringify({ type: "fiber-payment-request" }))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    expect(() => parseFiberPaymentRequest(bad)).toThrow(
      FiberInvalidPaymentRequestError,
    );
  });

  it("rejects empty input", () => {
    expect(() => parseFiberPaymentRequest("")).toThrow(
      FiberInvalidPaymentRequestError,
    );
  });

  it("rejects encoding without an invoice", () => {
    // @ts-expect-error intentionally missing invoice
    expect(() => encodeFiberPaymentRequest({ amount: "1" })).toThrow();
  });
});
