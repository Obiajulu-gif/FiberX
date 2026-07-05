# FiberX Roadmap

## Near-term

- **Real Fiber node integration testing** — run the proxy in `real` mode against
  a live FNN on testnet; verify the `FiberRpcProvider` mapping end-to-end and
  refine field names as the RPC settles.
- **Wallet extension provider support** — flesh out the `window.fiber` injected
  provider path so browser wallet extensions can plug in via `requestProvider()`.
- **QR code support** — render `fiber:` payment requests and invoices as QR
  codes in `FiberInvoiceCard`, and scan-to-pay in the payment flow.
- **Better invoice parsing** — decode real Fiber invoice strings client-side
  (amount, asset, expiry) without a round-trip where possible.
- **More assets** — first-class metadata for additional RGB++ assets and
  stablecoins beyond CKB/RUSD.
- **Hosted demo deployment** — a public demo (proxy in mock mode) for judges.
- **Error-code mapping from Fiber RPC** — map node error codes to the SDK's
  `PaymentReadinessCode` / error classes for precise diagnostics.

## Long-term

- **A Fiber WebLN-style standard** — propose a common `window.fiber` provider
  interface so wallets and apps interoperate, the way WebLN did for Lightning.
- **Nostr-like Fiber Wallet Connect protocol** — a remote, permissioned
  app-to-wallet connection protocol (NWC for Fiber) so a web app can pair with a
  self-custodial Fiber wallet over a relay.
- **Multi-wallet support** — manage and switch between multiple connected
  providers.
- **LSP / liquidity integration** — surface inbound-liquidity and
  just-in-time-channel flows in the readiness engine and UI.
- **CCH payment support** — cross-chain hub payments (Lightning ⇄ Fiber) exposed
  through the same provider interface.
- **Browser extension** — a reference FiberX wallet extension implementing the
  injected provider.
