import { FiberConnectButton } from "@fiberx/react";

export function DemoHeader() {
  return (
    <header className="demo-header">
      <div className="demo-header-inner">
        <div className="brand">
          <div className="brand-mark">FX</div>
          <div>
            <h1>FiberX — Fiber Wallet Connect SDK</h1>
            <p className="subtitle">
              Drop-in wallet connection, invoices, readiness checks, and payment
              status UI for Fiber apps.
            </p>
          </div>
        </div>
        <FiberConnectButton />
      </div>
    </header>
  );
}
