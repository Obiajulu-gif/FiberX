# FiberX — 2-Minute Demo Script

A tight walkthrough for a hackathon submission video.

---

**[0:00–0:15] The problem**

> "Every web app that wants Fiber payments has to learn the node's JSON-RPC,
> normalise messy responses, and figure out how to safely reach a node from the
> browser. There's no 'WebLN for Fiber.' FiberX is that missing infrastructure:
> a drop-in SDK, React kit, and secure proxy."

**[0:15–0:25] Install**

> "It's a pnpm monorepo. `pnpm install`, `pnpm dev`, open localhost:5173.
> Everything runs in mock mode with no Fiber node required."

Show the terminal: proxy on :3099, demo on :5173.

**[0:25–0:40] Connect modal**

> "Click Connect Fiber Wallet. You get a WebLN-style modal: choose Mock, Proxy,
> or an injected wallet, and see exactly which permissions the app requests."

Select **Mock Fiber Wallet → Connect**. Show the Connection panel populate:
Demo Fiber Wallet, network mock, pubkey `02mock…0001`, 3 channels; the Channels
panel shows 2 ready, 800 CKB and 500 RUSD outbound.

**[0:40–0:55] Create an invoice**

> "In the Invoice playground I'll create a 1 CKB invoice."

Set amount `1`, currency CKB, click **Create invoice**. Show the invoice card:
address starts with `fibt_mock_`, with a copy button, amount, hash, status.

**[0:55–1:10] Readiness — "Can I pay?"**

> "Before paying, FiberX answers 'Can I pay?' — this matters on a channel
> network. Green READY, estimated fee, route confidence."

Click **Can I pay?** → ✅ READY, fee 1000 shannons, confidence high.

**[1:10–1:30] Successful payment**

> "Now pay. The modal walks the lifecycle: checking readiness → pending →
> succeeded — with a receipt and preimage. Every step is a typed SDK event,
> streaming into the event log."

Click **Pay invoice**, show modal → **Payment succeeded**, then the event log
entries `payment:created → pending → succeeded`.

**[1:30–1:45] Failure diagnostic**

> "Infrastructure has to handle failure well. Create a 999,999 CKB invoice and
> check readiness."

Show ❌ `INSUFFICIENT_OUTBOUND_CAPACITY` with a recommended action.

**[1:45–1:55] Developer API**

> "For developers it's a few lines: connect a provider, makeInvoice, canPay,
> sendPayment — identical code whether it's the mock, the proxy, or a real node."

Flash the README SDK snippet.

**[1:55–2:00] Real node + close**

> "Flip the proxy to real mode and it forwards to a live Fiber node — no app
> changes. All Fiber RPC lives in one compatibility file. That's FiberX."

Show `pnpm test` green (49 passing) as the outro.
