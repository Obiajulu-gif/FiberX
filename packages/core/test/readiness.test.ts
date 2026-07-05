import { describe, it, expect } from "vitest";
import { checkPaymentReadiness } from "../src/readiness.js";
import type { FiberChannel } from "../src/types.js";

const ckbChannel: FiberChannel = {
  channelId: "0xckb",
  stateName: "ChannelReady",
  peerPubkey: "02peer",
  localBalance: "80000000000",
  remoteBalance: "30000000000",
  currency: { code: "CKB", decimals: 8 },
  public: true,
  isReady: true,
};

describe("checkPaymentReadiness", () => {
  it("returns READY when amount <= outbound capacity", () => {
    const res = checkPaymentReadiness({
      channels: [ckbChannel],
      amount: "100000000",
      currencyCode: "CKB",
    });
    expect(res.ok).toBe(true);
    expect(res.code).toBe("READY");
    expect(res.estimatedFee).toBeDefined();
    expect(res.routeConfidence).toBe("high");
  });

  it("returns INSUFFICIENT_OUTBOUND_CAPACITY when too high", () => {
    const res = checkPaymentReadiness({
      channels: [ckbChannel],
      amount: "99999900000000",
      currencyCode: "CKB",
    });
    expect(res.ok).toBe(false);
    expect(res.code).toBe("INSUFFICIENT_OUTBOUND_CAPACITY");
    expect(res.recommendedAction).toContain("smaller amount");
  });

  it("returns ASSET_UNSUPPORTED when asset not in channels", () => {
    const res = checkPaymentReadiness({
      channels: [ckbChannel],
      amount: "1",
      currencyCode: "RUSD",
    });
    expect(res.ok).toBe(false);
    expect(res.code).toBe("ASSET_UNSUPPORTED");
  });

  it("returns INVOICE_INVALID when invoice cannot parse", () => {
    const res = checkPaymentReadiness({
      channels: [ckbChannel],
      invoiceValid: false,
    });
    expect(res.ok).toBe(false);
    expect(res.code).toBe("INVOICE_INVALID");
  });

  it("returns FEE_TOO_HIGH when estimated fee exceeds max", () => {
    const res = checkPaymentReadiness({
      channels: [ckbChannel],
      amount: "100000000",
      currencyCode: "CKB",
      maxFeeAmount: "1",
    });
    expect(res.code).toBe("FEE_TOO_HIGH");
  });

  it("returns PAYMENT_ALREADY_PAID when flagged", () => {
    const res = checkPaymentReadiness({
      channels: [ckbChannel],
      alreadyPaid: true,
    });
    expect(res.code).toBe("PAYMENT_ALREADY_PAID");
  });
});
