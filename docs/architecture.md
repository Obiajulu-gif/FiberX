# FiberX Architecture

FiberX is a pnpm workspace with two libraries and two apps. The guiding
principle: **apps depend on a stable provider interface, and all Fiber-node
specifics are quarantined in one place.**

## Packages and apps

### `packages/core` — the SDK

Framework-agnostic, isomorphic (browser + Node). Exposes:

- **`FiberProvider`** — the single interface every backend implements
  (`enable`, `getInfo`, `listChannels`, `getBalance`, `makeInvoice`,
  `parseInvoice`, `getInvoice`, `canPay`, `sendPayment`, `getPayment`, `on`).
- **Three provider implementations:**
  - `MockFiberProvider` — a full in-memory Fiber node. No external services.
  - `ProxyFiberProvider` — calls the FiberX proxy's REST API (browser default).
  - `FiberRpcProvider` — calls a real node's JSON-RPC (server-side).
- **`FiberConnectClient`** — manages provider creation + connection state.
- **Codecs & utilities:** `payment-request.ts` (base64url `fiber:` envelope),
  `hex.ts` (hex ⇄ decimal, precision-safe via BigInt), `readiness.ts` (the
  pure "Can I pay?" engine), `events.ts` (typed event emitter).
- **Error classes:** `FiberConnectError`, `FiberProviderNotFoundError`,
  `FiberUserRejectedError`, `FiberRpcError`, `FiberReadinessError`,
  `FiberInvalidPaymentRequestError`.

### `packages/react` — React bindings

A thin, ergonomic layer over `@fiberx/core`:

- **`FiberConnectProvider`** context owns a `FiberConnectClient`.
- **Hooks:** `useFiberConnect`, `useFiberProvider`, `useFiberChannels`,
  `useFiberInvoice`, `useFiberReadiness`, `useFiberPayment`.
- **Components:** `FiberConnectButton`, `FiberConnectModal`,
  `FiberPaymentButton`, `FiberPaymentModal`, `FiberReadinessBadge`,
  `FiberInvoiceCard`, `FiberChannelList`. Styles are local CSS, namespaced with
  `.fx-`.

### `apps/proxy` — the secure gateway

A Fastify server. It is the only component that ever holds a real node URL/key.

- Auth via `x-fiber-connect-key`, CORS locked to a configured origin, basic rate
  limiting.
- A curated REST surface (allow-list in `security.ts`) — **no** generic RPC
  passthrough.
- `mode=mock` uses the same `MockFiberProvider` as the browser SDK, so mock
  semantics are identical everywhere. `mode=real` uses `FiberRpcProvider`.

### `apps/demo` — the playground

A Vite + React app that wires the components together into connect / channels /
invoice / readiness / payment / event-log panels. It is a real, working app —
not a static mockup.

## Why the browser uses a provider/proxy, not direct FNN RPC

A Fiber node's JSON-RPC can mint invoices and move money. Putting that endpoint
(and its credentials) in browser-reachable code is a security hazard and a CORS
headache. FiberX therefore:

1. Defaults browser apps to `ProxyFiberProvider`.
2. Keeps the node URL/key server-side in the proxy.
3. Restricts the proxy to an explicit allow-list of operations.

`FiberRpcProvider` still exists and is fully implemented — it is meant for
server-side use (including *inside* the proxy in real mode).

## How this mirrors WebLN / Bitcoin Connect — adapted to Fiber

- **Provider discovery + `enable()`** mirrors WebLN's `window.webln.enable()`.
  FiberX adds `requestProvider()` and a `window.fiber` injected-provider hook.
- **A connect modal with permission disclosure** mirrors Bitcoin Connect's
  connect flow; FiberX lists Fiber-specific scopes (info, channels, invoices,
  readiness, payments).
- **`makeInvoice` / `sendPayment`** mirror WebLN, but return Fiber-shaped
  results (multi-asset currencies, channel-aware readiness).
- **New for Fiber:** `canPay()` / the readiness engine. Because Fiber is a
  payment-channel network, "do I have a route and outbound capacity for this
  asset?" is a first-class question — FiberX makes it a one-call, typed answer
  with actionable failure codes.

## Data-flow example: "Create and pay"

```
UI ─ makeInvoice ─► provider ─► (mock | proxy REST | node RPC) ─► invoice
UI ─ canPay ──────► provider ─► readiness engine / node dry-run ─► READY|reason
UI ─ sendPayment ─► provider ─► created → pending → succeeded (events)
UI ─ getPayment ──► provider ─► latest status (polled by useFiberPayment)
```

Every arrow to a backend goes through the same `FiberProvider` interface, so the
UI is identical whether the backend is mock, proxy, or a real node.
