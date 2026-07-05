# Fiber RPC Mapping

FiberX isolates **all** Fiber Network Node (FNN) RPC details in one file:
[`packages/core/src/adapters/fiber-rpc-provider.ts`](../packages/core/src/adapters/fiber-rpc-provider.ts).
The RPC method names live in the exported `FIBER_RPC_METHODS` table there.

> ⚠️ Fiber's RPC is still evolving. If the node renames a method or changes a
> field, update `FIBER_RPC_METHODS` and the `normalize*` helpers in that file —
> nothing else in the SDK, React kit, or apps needs to change.

## SDK method → Proxy endpoint → Fiber RPC method

| SDK method (`FiberProvider`) | Proxy endpoint | Fiber RPC method | Notes |
| --- | --- | --- | --- |
| `getInfo()` | `GET /api/node-info` | `node_info` | Normalises `node_id`/`public_key` → `pubkey`, counts, features. |
| `listChannels()` | `GET /api/channels` | `list_channels` | snake_case → camelCase; hex balances → decimal strings; state → `isReady`. |
| `getBalance()` | `GET /api/balance` | (aggregated) | No dedicated balance RPC yet — computed from `list_channels`, grouped by asset. |
| `makeInvoice()` | `POST /api/invoices` | `new_invoice` | Maps amount/currency/expiry; passes `udt_type_script` for UDT assets. |
| `parseInvoice()` | `POST /api/invoices/parse` | `parse_invoice` | Extracts amount, currency, description, payment hash, expiry, payee. |
| `getInvoice()` | `GET /api/invoices/:hash` | `get_invoice` | Invoice lookup by payment hash; adds `status`. |
| `canPay()` | `POST /api/can-pay` | `send_payment` (dry-run) → fallback | 1) `parse_invoice`; 2) try `send_payment` with `dry_run: true`; 3) fall back to the local channel-capacity heuristic. Returns a typed `PaymentReadinessResult`. |
| `sendPayment()` | `POST /api/payments/send` | `send_payment` | Normalises status (`Created`/`Pending`/`Succeeded`/`Failed`), fee, preimage, error. |
| `getPayment()` | `GET /api/payments/:hash` | `get_payment` | Adds `createdAt` / `lastUpdatedAt`; normalises status. |
| (allow-listed, reserved) | — | `list_payments` | Permitted by the proxy allow-list for future use. |

## Normalisation rules

- **Numbers:** FNN returns many integers as `0x`-hex. FiberX converts them to
  **decimal strings** via BigInt (`hex.ts`) so large balances never lose
  precision. Human rendering uses `formatUnits(baseUnits, decimals)`.
- **Casing:** RPC snake_case (`payment_hash`, `local_balance`) → SDK camelCase
  (`paymentHash`, `localBalance`). Multiple candidate keys are tried so minor
  RPC drift doesn't break parsing.
- **Raw preserved:** every normalised result keeps the untouched response under
  `raw` (or `details`) for debugging and forward-compatibility.
- **Currencies:** native channels are `CKB`; channels with a `udt_type_script`
  are treated as UDT assets (e.g. RGB++ assets, RUSD), carrying the type script
  through for the node.

## Readiness (`canPay`) strategy in detail

```
canPay(invoice)
  ├─ parse_invoice  ───────────────► amount, currency
  ├─ send_payment { dry_run: true } ─► READY (+ node fee) if supported & ok
  └─ if dry-run unsupported/failed:
       checkPaymentReadiness(localChannels, amount, currency)
         → READY | INSUFFICIENT_OUTBOUND_CAPACITY | ASSET_UNSUPPORTED
           | FEE_TOO_HIGH | INVOICE_INVALID | ...
```

This gives apps a consistent, actionable "Can I pay?" answer whether or not the
node supports payment dry-runs.
