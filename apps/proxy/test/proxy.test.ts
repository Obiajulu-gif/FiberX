import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../src/index.js";

const KEY = "test-secret";
const auth = { "x-fiber-connect-key": KEY };

describe("FiberX proxy (mock mode)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({
      apiKey: KEY,
      mode: "mock",
      corsOrigin: "*",
      logLevel: "silent",
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health is public and reports mode", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      ok: true,
      mode: "mock",
      service: "fiber-connect-proxy",
    });
  });

  it("rejects unauthorized API requests", async () => {
    const res = await app.inject({ method: "GET", url: "/api/node-info" });
    expect(res.statusCode).toBe(401);
  });

  it("returns node info when authorized", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/node-info",
      headers: auth,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.nodeName).toBe("Demo Fiber Wallet");
    expect(body.network).toBe("mock");
    expect(body.channelCount).toBe(3);
  });

  it("lists channels", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/channels",
      headers: auth,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().channels.length).toBe(3);
  });

  it("creates an invoice", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/invoices",
      headers: auth,
      payload: {
        amount: "100000000",
        currency: { code: "CKB", decimals: 8 },
        description: "Demo invoice",
        expirySeconds: 3600,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.invoiceAddress.startsWith("fibt_mock_")).toBe(true);
    expect(body.status).toBe("Open");
  });

  it("can-pay succeeds for a small payment", async () => {
    const invoiceRes = await app.inject({
      method: "POST",
      url: "/api/invoices",
      headers: auth,
      payload: { amount: "100000000", currency: { code: "CKB", decimals: 8 } },
    });
    const { invoiceAddress } = invoiceRes.json();

    const res = await app.inject({
      method: "POST",
      url: "/api/can-pay",
      headers: auth,
      payload: { invoice: invoiceAddress },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true, code: "READY" });
  });

  it("can-pay fails for an oversized payment", async () => {
    const invoiceRes = await app.inject({
      method: "POST",
      url: "/api/invoices",
      headers: auth,
      payload: {
        amount: "99999900000000000",
        currency: { code: "CKB", decimals: 8 },
      },
    });
    const { invoiceAddress } = invoiceRes.json();

    const res = await app.inject({
      method: "POST",
      url: "/api/can-pay",
      headers: auth,
      payload: { invoice: invoiceAddress },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      ok: false,
      code: "INSUFFICIENT_OUTBOUND_CAPACITY",
    });
  });

  it("sends a payment and eventually reports Succeeded", async () => {
    const invoiceRes = await app.inject({
      method: "POST",
      url: "/api/invoices",
      headers: auth,
      payload: { amount: "100000000", currency: { code: "CKB", decimals: 8 } },
    });
    const { invoiceAddress } = invoiceRes.json();

    const sendRes = await app.inject({
      method: "POST",
      url: "/api/payments/send",
      headers: auth,
      payload: { invoice: invoiceAddress, maxFeeAmount: "10000" },
    });
    expect(sendRes.statusCode).toBe(200);
    const sent = sendRes.json();
    expect(sent.status).toBe("Created");
    expect(sent.paymentHash).toBeDefined();

    // Poll until settled (mock settles in ~800ms).
    let status = "Created";
    for (let i = 0; i < 40 && status !== "Succeeded"; i++) {
      await new Promise((r) => setTimeout(r, 100));
      const poll = await app.inject({
        method: "GET",
        url: `/api/payments/${sent.paymentHash}`,
        headers: auth,
      });
      status = poll.json().status;
    }
    expect(status).toBe("Succeeded");
  });

  it("rejects invalid invoice bodies", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/invoices",
      headers: auth,
      payload: { amount: 123 },
    });
    expect(res.statusCode).toBe(400);
  });
});
