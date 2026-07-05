import { describe, it, expect } from "vitest";
import { MockFiberProvider } from "../src/mock-provider.js";
import type { FiberEventName } from "../src/types.js";

function makeProvider() {
  // Speed up timers for tests.
  return new MockFiberProvider({ enableDelayMs: 5, settleDelayMs: 20 });
}

describe("MockFiberProvider", () => {
  it("enable() connects and emits connect", async () => {
    const provider = makeProvider();
    let connected = false;
    provider.on("connect", () => {
      connected = true;
    });
    expect(provider.isConnected()).toBe(false);
    const grant = await provider.enable();
    expect(provider.isConnected()).toBe(true);
    expect(grant.providerType).toBe("mock");
    expect(connected).toBe(true);
  });

  it("getInfo() returns the demo node", async () => {
    const provider = makeProvider();
    await provider.enable();
    const info = await provider.getInfo();
    expect(info.nodeName).toBe("Demo Fiber Wallet");
    expect(info.network).toBe("mock");
    expect(info.channelCount).toBe(3);
  });

  it("makeInvoice() creates an invoice starting with fibt_mock_", async () => {
    const provider = makeProvider();
    await provider.enable();
    const invoice = await provider.makeInvoice({
      amount: "100000000",
      currency: { code: "CKB", decimals: 8 },
      description: "Test",
    });
    expect(invoice.invoiceAddress.startsWith("fibt_mock_")).toBe(true);
    expect(invoice.paymentHash.startsWith("0x")).toBe(true);
  });

  it("parseInvoice() parses an invoice it created", async () => {
    const provider = makeProvider();
    await provider.enable();
    const invoice = await provider.makeInvoice({
      amount: "100000000",
      currency: { code: "CKB", decimals: 8 },
      description: "Test",
    });
    const parsed = await provider.parseInvoice(invoice.invoiceAddress);
    expect(parsed.invoiceAddress).toBe(invoice.invoiceAddress);
    expect(parsed.amount).toBe("100000000");
    expect(parsed.currency?.code).toBe("CKB");
  });

  it("canPay() returns READY for a small payment", async () => {
    const provider = makeProvider();
    await provider.enable();
    const invoice = await provider.makeInvoice({
      amount: "100000000",
      currency: { code: "CKB", decimals: 8 },
    });
    const readiness = await provider.canPay({
      invoice: invoice.invoiceAddress,
    });
    expect(readiness.ok).toBe(true);
    expect(readiness.code).toBe("READY");
  });

  it("canPay() returns INSUFFICIENT_OUTBOUND_CAPACITY for a huge payment", async () => {
    const provider = makeProvider();
    await provider.enable();
    const invoice = await provider.makeInvoice({
      amount: "99999900000000000",
      currency: { code: "CKB", decimals: 8 },
    });
    const readiness = await provider.canPay({
      invoice: invoice.invoiceAddress,
    });
    expect(readiness.ok).toBe(false);
    expect(readiness.code).toBe("INSUFFICIENT_OUTBOUND_CAPACITY");
  });

  it("sendPayment() eventually succeeds and getPayment() reflects it", async () => {
    const provider = makeProvider();
    await provider.enable();
    const invoice = await provider.makeInvoice({
      amount: "100000000",
      currency: { code: "CKB", decimals: 8 },
    });

    const succeeded = new Promise<void>((resolve) => {
      provider.on("payment:succeeded", () => resolve());
    });

    const sent = await provider.sendPayment({
      invoice: invoice.invoiceAddress,
    });
    expect(sent.status).toBe("Created");

    await succeeded;
    const final = await provider.getPayment(sent.paymentHash);
    expect(final.status).toBe("Succeeded");
    expect(final.preimage).toBeDefined();
  });

  it("emits payment events in order", async () => {
    const provider = makeProvider();
    await provider.enable();
    const invoice = await provider.makeInvoice({
      amount: "100000000",
      currency: { code: "CKB", decimals: 8 },
    });

    const order: FiberEventName[] = [];
    provider.on("payment:created", () => order.push("payment:created"));
    provider.on("payment:pending", () => order.push("payment:pending"));
    const done = new Promise<void>((resolve) => {
      provider.on("payment:succeeded", () => {
        order.push("payment:succeeded");
        resolve();
      });
    });

    await provider.sendPayment({ invoice: invoice.invoiceAddress });
    await done;

    expect(order).toEqual([
      "payment:created",
      "payment:pending",
      "payment:succeeded",
    ]);
  });

  it("sendPayment() fails for an unpayable invoice", async () => {
    const provider = makeProvider();
    await provider.enable();
    const invoice = await provider.makeInvoice({
      amount: "99999900000000000",
      currency: { code: "CKB", decimals: 8 },
    });
    const failed = new Promise<void>((resolve) => {
      provider.on("payment:failed", () => resolve());
    });
    const res = await provider.sendPayment({
      invoice: invoice.invoiceAddress,
    });
    expect(res.status).toBe("Failed");
    expect(res.failedError).toContain("INSUFFICIENT_OUTBOUND_CAPACITY");
    await failed;
  });
});
