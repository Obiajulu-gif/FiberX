# FiberX API Reference

## `@fiberx/core`

### Factories

| Function | Description |
| --- | --- |
| `initFiberConnect(config)` | Returns a `FiberConnectClient`. |
| `createMockFiberProvider(config?)` | In-memory provider. No node needed. |
| `createProxyFiberProvider({ proxyUrl, proxyApiKey?, network?, appName? })` | Provider that calls the FiberX proxy REST API. |
| `createFiberProvider({ rpcUrl, headers?, network?, appName? })` | Provider that calls a Fiber node's JSON-RPC (server-side). |
| `requestProvider()` | WebLN-style discovery of an injected `window.fiber` provider. |

### `FiberProvider`

```ts
interface FiberProvider {
  readonly meta: FiberProviderMeta;          // { type, label, network }
  enable(): Promise<FiberPermissionGrant>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  getInfo(): Promise<FiberNodeInfo>;
  listChannels(params?): Promise<FiberChannel[]>;
  getBalance(params?): Promise<FiberBalance>;

  makeInvoice(params: MakeInvoiceParams): Promise<MakeInvoiceResult>;
  parseInvoice(invoice: string): Promise<ParseInvoiceResult>;
  getInvoice(paymentHash: string): Promise<GetInvoiceResult>;

  canPay(params: CanPayParams): Promise<PaymentReadinessResult>;
  sendPayment(params: SendPaymentParams): Promise<SendPaymentResult>;
  getPayment(paymentHash: string): Promise<GetPaymentResult>;

  on(event, listener): () => void;           // returns an unsubscribe fn
}
```

### `FiberConnectClient`

| Method | Description |
| --- | --- |
| `connect(type?)` | Create + `enable()` a provider (`"mock" \| "proxy" \| "rpc" \| "injected"`). |
| `disconnect()` | Disconnect and clear the active provider. |
| `getProvider()` / `getGrant()` | Current provider / permission grant. |
| `isConnected()` | Whether the active provider is connected. |
| `createProvider(type)` | Build (without enabling) a provider of a given type. |

### Events

`connect`, `disconnect`, `invoice:created`, `payment:created`,
`payment:pending`, `payment:succeeded`, `payment:failed`, `readiness:checked`,
`error`. Subscribe with `provider.on(name, listener)`.

### Payment-request codec

| Function | Description |
| --- | --- |
| `encodeFiberPaymentRequest(request)` | → `fiber:` + base64url(JSON). Validates with Zod. |
| `parseFiberPaymentRequest(input)` | Accepts a `fiber:` string **or** a raw invoice. Returns a validated `FiberPaymentRequest`. |
| `isEncodedPaymentRequest(input)` | True for `fiber:` strings. |

### Readiness engine

`checkPaymentReadiness({ channels, amount?, currencyCode?, invoiceValid?, maxFeeAmount?, alreadyPaid? })`
→ `PaymentReadinessResult { ok, code, message, recommendedAction?, estimatedFee?, routeConfidence?, details? }`.

Codes: `READY`, `NO_PROVIDER`, `NODE_OFFLINE`, `NO_ROUTE`,
`INSUFFICIENT_OUTBOUND_CAPACITY`, `INSUFFICIENT_INBOUND_CAPACITY`,
`ASSET_UNSUPPORTED`, `FEE_TOO_HIGH`, `INVOICE_INVALID`, `PAYMENT_ALREADY_PAID`,
`UNKNOWN`.

### Hex helpers

`isHexString`, `hexToDecimalString`, `hexToBigInt`, `decimalStringToHex`,
`toDecimalString`, `formatUnits(baseUnits, decimals)`.

### Errors

`FiberConnectError` (base, has `.code`), `FiberProviderNotFoundError`,
`FiberUserRejectedError`, `FiberRpcError` (`.rpcCode`, `.method`),
`FiberReadinessError`, `FiberInvalidPaymentRequestError`.

---

## `@fiberx/react`

### `<FiberConnectProvider>`

Props: `appName` (required), `network?`, `defaultProvider?`, `proxyUrl?`,
`proxyApiKey?`, `rpcUrl?`, `mock?` (mock provider options). Import
`@fiberx/react/styles.css` once.

### Hooks

| Hook | Returns |
| --- | --- |
| `useFiberConnect()` | `{ provider, grant, connected, connecting, error, availableProviders, connect, disconnect }` |
| `useFiberProvider()` | The active `FiberProvider \| undefined`. |
| `useFiberChannels()` | `{ channels, loading, error, refresh }` |
| `useFiberInvoice()` | `{ invoice, creating, error, create, parse, reset }` |
| `useFiberReadiness()` | `{ readiness, checking, check, reset }` |
| `useFiberPayment()` | `{ phase, readiness, payment, error, pay, reset }` (drives canPay → send → poll) |

### Components

| Component | Purpose |
| --- | --- |
| `FiberConnectButton` | Connect/connected button; opens the modal. |
| `FiberConnectModal` | Provider choice + permission disclosure + connect/disconnect. |
| `FiberPaymentButton` | One-click pay with a status modal. Props: `invoice`, `amount?`, `currency?`, `maxFeeAmount?`, `onPaid?`, `onError?`. |
| `FiberPaymentModal` | Visualises checking → ready → pending → succeeded/failed. |
| `FiberReadinessBadge` | Green "Ready" / yellow "Check needed" / red code + action. |
| `FiberInvoiceCard` | Invoice address (with copy), amount, currency, description, hash, status. |
| `FiberChannelList` | Table of channels: state, short peer, asset, balances, readiness. |

---

## `@fiberx/proxy` REST API

All `/api/*` endpoints require `x-fiber-connect-key`.

| Method + path | Body / params | Returns |
| --- | --- | --- |
| `GET /health` | — | `{ ok, mode, service }` (public) |
| `GET /api/node-info` | — | node summary |
| `GET /api/channels` | `?peerPubkey=` | `{ channels: [] }` |
| `GET /api/balance` | — | aggregated balances |
| `POST /api/invoices` | `{ amount, currency, description?, expirySeconds? }` | `{ invoiceAddress, paymentHash, status }` |
| `POST /api/invoices/parse` | `{ invoice }` | parsed invoice |
| `GET /api/invoices/:paymentHash` | — | invoice by hash |
| `POST /api/can-pay` | `{ invoice?, amount?, currency?, maxFeeAmount? }` | `PaymentReadinessResult` |
| `POST /api/payments/send` | `{ invoice, maxFeeAmount?, timeoutSeconds?, dryRun? }` | `{ paymentHash, status, fee, ... }` |
| `GET /api/payments/:paymentHash` | — | `{ paymentHash, status, fee, createdAt, lastUpdatedAt }` |

Errors are returned as `{ ok: false, error, message, details? }` with an
appropriate status code (`400` validation, `401` auth, `429` rate limit, `502`
node unreachable in real mode).
