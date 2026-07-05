/**
 * Payment readiness engine.
 *
 * This is a pure, provider-agnostic heuristic that answers the question
 * "can I pay this?" using only local channel state. Both the mock provider
 * and the JSON-RPC provider's fallback path use it, which keeps the "Can I
 * pay?" UX consistent regardless of backend.
 *
 * It is intentionally conservative: it checks asset support and outbound
 * capacity, and estimates a simple fee. Real routing is done by the node.
 */

import type {
  FiberChannel,
  PaymentReadinessCode,
  PaymentReadinessResult,
} from "./types.js";

export type ReadinessInput = {
  /** Ready channels to evaluate against (only `isReady` ones are counted). */
  channels: FiberChannel[];
  /** Amount to pay, in base units (decimal string). */
  amount?: string;
  /** Currency code to pay in, e.g. "CKB" or "RUSD". */
  currencyCode?: string;
  /** Whether the invoice parsed successfully. */
  invoiceValid?: boolean;
  /** Optional caller fee cap in base units. */
  maxFeeAmount?: string;
  /** Whether this payment hash was already paid. */
  alreadyPaid?: boolean;
};

const READINESS_MESSAGES: Record<PaymentReadinessCode, string> = {
  READY: "Payment appears payable.",
  NO_PROVIDER: "No Fiber provider is connected.",
  NODE_OFFLINE: "The Fiber node appears to be offline.",
  NO_ROUTE: "No route to the destination could be found.",
  INSUFFICIENT_OUTBOUND_CAPACITY:
    "Not enough ready outbound capacity for this payment.",
  INSUFFICIENT_INBOUND_CAPACITY:
    "Not enough inbound capacity to receive this payment.",
  ASSET_UNSUPPORTED: "No channel supports the requested asset.",
  FEE_TOO_HIGH: "The estimated fee exceeds your maximum fee.",
  INVOICE_INVALID: "The invoice could not be parsed.",
  PAYMENT_ALREADY_PAID: "This invoice has already been paid.",
  UNKNOWN: "Payment readiness could not be determined.",
};

const RECOMMENDED_ACTIONS: Partial<Record<PaymentReadinessCode, string>> = {
  INSUFFICIENT_OUTBOUND_CAPACITY:
    "Try a smaller amount, add liquidity, or use another asset.",
  INSUFFICIENT_INBOUND_CAPACITY:
    "Ask the payer to open more inbound capacity or use a smaller amount.",
  ASSET_UNSUPPORTED:
    "Open a channel that supports this asset, or pay in a supported currency.",
  FEE_TOO_HIGH: "Increase your maximum fee or wait for cheaper routes.",
  NO_ROUTE: "Check connectivity to the destination or try again later.",
  NODE_OFFLINE: "Check that your Fiber node is running and reachable.",
  INVOICE_INVALID: "Double-check the invoice string and try again.",
  PAYMENT_ALREADY_PAID: "No action needed — this invoice is already settled.",
};

function result(
  code: PaymentReadinessCode,
  extra: Partial<PaymentReadinessResult> = {},
): PaymentReadinessResult {
  return {
    ok: code === "READY",
    code,
    message: READINESS_MESSAGES[code],
    recommendedAction: RECOMMENDED_ACTIONS[code],
    ...extra,
  };
}

/** Sum ready outbound capacity for a given currency across channels. */
export function readyOutboundCapacity(
  channels: FiberChannel[],
  currencyCode: string,
): bigint {
  return channels
    .filter((c) => c.isReady && c.currency.code === currencyCode)
    .reduce((acc, c) => acc + BigInt(c.localBalance || "0"), 0n);
}

/**
 * A simple, deterministic fee estimate: ~0.001% of the amount (amount / 100000),
 * floored at 1 base unit for any non-zero payment. e.g. a 100,000,000 shannon
 * payment estimates a 1,000 shannon fee. Real fees come from the node; this is
 * only used to give the UX a plausible number and to honour `maxFeeAmount`.
 */
export function estimateFee(amount: bigint): bigint {
  if (amount <= 0n) return 0n;
  const fee = amount / 100000n;
  return fee > 0n ? fee : 1n;
}

/**
 * Evaluate readiness against local channel state. Pure and synchronous.
 */
export function checkPaymentReadiness(
  input: ReadinessInput,
): PaymentReadinessResult {
  if (input.invoiceValid === false) {
    return result("INVOICE_INVALID", { routeConfidence: "unknown" });
  }

  if (input.alreadyPaid) {
    return result("PAYMENT_ALREADY_PAID", { routeConfidence: "unknown" });
  }

  const currencyCode = input.currencyCode ?? "CKB";
  const amount = BigInt(input.amount ?? "0");

  const supportsAsset = input.channels.some(
    (c) => c.currency.code === currencyCode,
  );
  if (!supportsAsset) {
    return result("ASSET_UNSUPPORTED", {
      routeConfidence: "low",
      details: { currencyCode },
    });
  }

  const capacity = readyOutboundCapacity(input.channels, currencyCode);
  if (amount > capacity) {
    return result("INSUFFICIENT_OUTBOUND_CAPACITY", {
      routeConfidence: "low",
      details: {
        currencyCode,
        requested: amount.toString(),
        readyOutboundCapacity: capacity.toString(),
      },
    });
  }

  const fee = estimateFee(amount);
  if (input.maxFeeAmount !== undefined) {
    const maxFee = BigInt(input.maxFeeAmount);
    if (fee > maxFee) {
      return result("FEE_TOO_HIGH", {
        estimatedFee: fee.toString(),
        routeConfidence: "medium",
        details: { maxFeeAmount: input.maxFeeAmount },
      });
    }
  }

  // Route confidence scales with how much headroom is left after the payment.
  const headroom = capacity - amount;
  const confidence =
    headroom >= amount ? "high" : headroom > 0n ? "medium" : "low";

  return result("READY", {
    estimatedFee: fee.toString(),
    routeConfidence: confidence,
    details: {
      currencyCode,
      readyOutboundCapacity: capacity.toString(),
    },
  });
}

export { READINESS_MESSAGES, RECOMMENDED_ACTIONS };
