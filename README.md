# FiberX — Fiber Wallet Connect SDK

> Drop-in wallet connection, invoices, readiness checks, and payment status UI for [Fiber Network](https://www.ckbfiber.net/) apps.

**🔗 Live demo: [fiber-x-demo.vercel.app](https://fiber-x-demo.vercel.app/)** · Proxy health: [fiberx-proxy.onrender.com/health](https://fiberx-proxy.onrender.com/health) · License: MIT

_The live demo runs fully in mock mode — no wallet or Fiber node required. Connect → create an invoice → run "Can I pay?" → pay, all in your browser._

FiberX is reusable **infrastructure** for the Fiber Network on CKB. It gives any
web app a safe, batteries-included way to **connect to a Fiber wallet/provider,
create invoices, check whether a payment can actually be made ("Can I pay?"),
send payments, and render payment status** — without hand-rolling Fiber JSON-RPC
plumbing.

It is inspired by the design of Lightning tooling such as WebLN, Bitcoin
Connect, the Alby JS SDK, and Nostr Wallet Connect, adapted to Fiber's
multi-asset, payment-channel model on CKB.

Built for the **"Gone in 60ms: Fiber Network Infrastructure Hackathon."**

---

## 1. Project summary

FiberX is a pnpm TypeScript monorepo with four parts:

| Package | What it is |
| --- | --- |
| [`@fiberx/core`](packages/core) | Framework-agnostic SDK: `FiberProvider` interface, mock provider, JSON-RPC adapter, proxy client, payment-request codec, readiness engine, typed events. Works in browser **and** Node. |
| [`@fiberx/react`](packages/react) | React bindings: `FiberConnectProvider`, hooks, and drop-in UI components (connect button/modal, payment button/modal, readiness badge, invoice card, channel list). |
| [`@fiberx/proxy`](apps/proxy) | A secure Fastify server that sits between the browser and a real Fiber node. Mock mode works with **no node at all**. |
| [`@fiberx/demo`](apps/demo) | A polished Vite + React + **Tailwind CSS** app with a liquid-glass **landing page** and interactive **dashboard**. Deployable to Vercel as a zero-backend showcase. |

**Deploy:** demo → [Vercel](docs/deploy-vercel.md) (static, mock mode) · proxy backend → [Render](docs/deploy-render.md) (`render.yaml` blueprint).

## 2. Selected hackathon category

**Wallet and Payment UX Infrastructure.**

## 3. Fiber infrastructure gap addressed

Today, every web app that wants to accept or send Fiber payments has to learn
the Fiber node's JSON-RPC surface, normalise its (evolving, snake_case, hex)
responses, decide how to safely expose a node to a browser, and build its own
connect/pay UX from scratch. There is no "WebLN for Fiber."

FiberX closes that gap: a **single, reusable provider interface + React kit +
secure proxy** that apps, wallets, and merchants can adopt in minutes. All Fiber
RPC details are isolated in **one compatibility layer**
([`fiber-rpc-provider.ts`](packages/core/src/adapters/fiber-rpc-provider.ts)),
so when Fiber's RPC changes, integrators change nothing.

## 4. What is fully working

- ✅ TypeScript SDK (`@fiberx/core`) — provider interface, events, codecs, readiness engine
- ✅ React connect + payment components (`@fiberx/react`)
- ✅ Mock Fiber provider (full invoice/readiness/payment lifecycle, in memory)
- ✅ Secure proxy API (`@fiberx/proxy`) with API-key auth, CORS, rate limiting
- ✅ JSON-RPC adapter for a **real** Fiber node (`FiberRpcProvider`)
- ✅ Demo app with connect, channels, invoice, readiness, payment, event log
- ✅ 49 unit/integration tests + Playwright e2e

## 5. What is mocked

- The mock wallet/payment **lifecycle** (created → pending → succeeded)
- Mock invoices (`fibt_mock_…` addresses)
- Mock channels (2 ready: CKB + RUSD, 1 pending CKB) and balances

## 6. What requires a real Fiber node

- Real payment **settlement** and preimages
- Real **channel states** and routing
- Real fee estimation (FiberX's estimate is a placeholder until the node answers)

Switch the proxy to real mode (see [Mock vs real mode](#mock-vs-real-mode)) to
forward calls to an actual Fiber Network Node.

## 7. Architecture (text diagram)

```
┌──────────────────────────────────────────────────────────────┐
│  Your web app (React)                                         │
│                                                              │
│   <FiberConnectProvider> ──► useFiberConnect()/hooks         │
│        │                                                     │
│        ▼                                                     │
│   @fiberx/react components (Connect / Pay / Readiness / …)   │
└────────┬─────────────────────────────────────────────────────┘
         │  uses
         ▼
┌──────────────────────────────────────────────────────────────┐
│  @fiberx/core  (FiberProvider interface)                     │
│                                                              │
│   ┌── MockFiberProvider ......... in-memory, no node         │
│   ├── ProxyFiberProvider ........ talks REST to the proxy    │  ◄── browser default
│   └── FiberRpcProvider .......... talks JSON-RPC to a node   │  ◄── server-side only
│           │                                                  │
│           └── all RPC names/shapes in ONE adapter file       │
└────────┬─────────────────────────────────────────────────────┘
         │  ProxyFiberProvider → HTTPS
         ▼
┌──────────────────────────────────────────────────────────────┐
│  @fiberx/proxy (Fastify)   x-fiber-connect-key auth + CORS   │
│    /health  /api/node-info  /api/channels  /api/balance      │
│    /api/invoices  /api/can-pay  /api/payments/*              │
│                                                              │
│    mode=mock ──► in-memory node                              │
│    mode=real ──► FiberRpcProvider ──► FIBER_RPC_URL          │
└──────────────────────────────────────────────────────────────┘
```

**Why the browser should not talk to a Fiber node directly:** a node's JSON-RPC
endpoint can create invoices and move funds. Exposing it (and any auth) to the
browser is unsafe. FiberX defaults the browser to the proxy, which enforces an
allow-list of read/write operations, never exposes raw RPC passthrough, and
keeps the node URL + key server-side.

## 8. Quickstart

```bash
pnpm install
cp .env.example .env      # optional; sensible defaults are built in
pnpm dev                  # builds the libs, then runs proxy (:3099) + demo (:5173)
# open http://localhost:5173
```

Then in the demo: **Connect Fiber Wallet → Mock Fiber Wallet → Connect**, create
a 1 CKB invoice, click **Can I pay?**, then **Pay invoice**.

> First run of `pnpm dev` builds `@fiberx/core` and `@fiberx/react` automatically.
> To run pieces separately: `pnpm dev:proxy` and `pnpm dev:demo`.

### Deploy the demo (Vercel)

The demo is a static SPA that runs fully in mock mode — no backend needed. Import
`Obiajulu-gif/FiberX` at <https://vercel.com/new> (keep Root Directory = repo
root); the included [`vercel.json`](vercel.json) configures the monorepo build.
Full steps: [docs/deploy-vercel.md](docs/deploy-vercel.md).

### Deploy with a real Fiber node

Fiber is a payment-channel network, not a web-hosting platform. To make FiberX
functional with real Fiber state/payments, run a Fiber Network Node, deploy the
FiberX proxy next to it with `FIBER_PROXY_MODE=real`, and point the hosted demo
at the proxy with `VITE_PROXY_URL` and `VITE_PROXY_API_KEY`.

Files added for this path:

- [`apps/proxy/.env.real.example`](apps/proxy/.env.real.example)
- [`apps/proxy/Dockerfile`](apps/proxy/Dockerfile)
- [`docker-compose.fiber-real.yml`](docker-compose.fiber-real.yml)
- [`docs/deploy-real-fiber.md`](docs/deploy-real-fiber.md)

## 9. Test / build commands

```bash
pnpm test         # core + react + proxy unit/integration tests (49 tests)
pnpm build        # build all packages and apps
pnpm typecheck    # strict tsc across the monorepo
pnpm test:e2e     # Playwright end-to-end against the demo (needs: pnpm exec playwright install chromium)
```

## 10. SDK usage examples

### Vanilla TypeScript (framework-free)

```ts
import { createMockFiberProvider } from "@fiberx/core";

const fiber = createMockFiberProvider({ appName: "My Shop" });
await fiber.enable();

const invoice = await fiber.makeInvoice({
  amount: "100000000",                       // 1 CKB, in shannons
  currency: { code: "CKB", decimals: 8 },
  description: "Coffee",
});

const readiness = await fiber.canPay({ invoice: invoice.invoiceAddress });
if (readiness.ok) {
  const payment = await fiber.sendPayment({ invoice: invoice.invoiceAddress });
  console.log(payment.status); // "Created" → settles to "Succeeded"
}
```

Swap `createMockFiberProvider()` for `createProxyFiberProvider({ proxyUrl, proxyApiKey })`
to hit a real node through the proxy — **no other code changes**.

### React

```tsx
import {
  FiberConnectProvider,
  FiberConnectButton,
  FiberPaymentButton,
  FiberReadinessBadge,
  useFiberConnect,
} from "@fiberx/react";
import "@fiberx/react/styles.css";

function App() {
  return (
    <FiberConnectProvider
      appName="Demo Fiber App"
      network="testnet"
      defaultProvider="mock"
      proxyUrl="http://localhost:3099"
      proxyApiKey="dev-secret"
    >
      <FiberConnectButton />
      <DemoCheckout />
    </FiberConnectProvider>
  );
}

function DemoCheckout() {
  const { provider, connected } = useFiberConnect();

  async function createAndPay() {
    if (!provider) return;
    const invoice = await provider.makeInvoice({
      amount: "100000000",
      currency: { code: "CKB", decimals: 8 },
      description: "Demo payment",
    });
    const readiness = await provider.canPay({ invoice: invoice.invoiceAddress });
    if (readiness.ok) {
      await provider.sendPayment({ invoice: invoice.invoiceAddress });
    }
  }

  return (
    <button onClick={createAndPay} disabled={!connected}>
      Create and Pay Demo Invoice
    </button>
  );
}
```

## 11. Proxy usage (curl)

```bash
# Public health check
curl http://localhost:3099/health

# Everything under /api requires the API key header
curl -H "x-fiber-connect-key: dev-secret" http://localhost:3099/api/node-info

# Create an invoice
curl -X POST http://localhost:3099/api/invoices \
  -H "x-fiber-connect-key: dev-secret" -H "content-type: application/json" \
  -d '{"amount":"100000000","currency":{"code":"CKB","decimals":8},"description":"Demo"}'

# Can I pay?
curl -X POST http://localhost:3099/api/can-pay \
  -H "x-fiber-connect-key: dev-secret" -H "content-type: application/json" \
  -d '{"invoice":"fibt_mock_ckb_0001_...","maxFeeAmount":"10000"}'

# Send + poll
curl -X POST http://localhost:3099/api/payments/send \
  -H "x-fiber-connect-key: dev-secret" -H "content-type: application/json" \
  -d '{"invoice":"fibt_mock_ckb_0001_...","maxFeeAmount":"10000"}'
curl -H "x-fiber-connect-key: dev-secret" http://localhost:3099/api/payments/0x...
```

## 12. API reference

See [docs/api-reference.md](docs/api-reference.md) for the full SDK + React +
proxy reference, and [docs/fiber-rpc-mapping.md](docs/fiber-rpc-mapping.md) for
the SDK → proxy → Fiber RPC mapping table.

## 13. Security notes

- **Never ship a Fiber node's JSON-RPC URL/key to the browser.** Use the proxy.
- The proxy requires `x-fiber-connect-key` on all `/api/*` endpoints.
- The proxy exposes **only** an allow-list of operations
  ([`security.ts`](apps/proxy/src/security.ts)); there is no arbitrary RPC
  passthrough, no key signing, and no dev/admin methods.
- CORS is locked to `CORS_ORIGIN`; basic rate limiting is enabled.
- FiberX holds **no private keys** and takes **no custody**.

### Mock vs real mode

The proxy runs in mock mode by default. To forward to a real node:

```bash
# .env
FIBER_PROXY_MODE=real
FIBER_RPC_URL=http://127.0.0.1:8227   # your Fiber Network Node
FIBER_PROXY_API_KEY=change-me
```

If the node is unreachable in real mode, the proxy returns a clear `502` telling
you to check `FIBER_RPC_URL` and node status. The browser code and demo do not
change between modes — only the provider/proxy configuration does.

## 14. Roadmap

See [docs/roadmap.md](docs/roadmap.md). Highlights: real-node integration
testing, QR codes, wallet-extension provider support, a Fiber WebLN-style
standard, and an NWC-like Fiber Wallet Connect protocol.

## 15. Hackathon submission checklist

- [x] Reusable infrastructure (SDK + components + proxy), not a consumer app
- [x] Works with **zero** external services via mock mode
- [x] Optional real Fiber node integration path
- [x] Fiber RPC isolated in one compatibility layer
- [x] Strong typing, error classes, Zod validation
- [x] 49 passing unit/integration tests + Playwright e2e
- [x] Documented architecture, API, RPC mapping, demo script, submission notes
- [x] Polished, responsive demo with the required happy + failure scenarios

## License

MIT — see [LICENSE](LICENSE).
