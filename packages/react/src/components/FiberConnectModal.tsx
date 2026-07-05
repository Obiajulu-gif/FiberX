/**
 * FiberConnectModal — provider selection + permission disclosure.
 */

import { useState } from "react";
import type { FiberProviderType } from "@fiberx/core";
import { useFiberConnect } from "../hooks.js";

const PROVIDER_LABELS: Record<FiberProviderType, string> = {
  mock: "Mock Fiber Wallet",
  proxy: "Fiber Proxy Wallet",
  rpc: "Fiber Node (JSON-RPC)",
  injected: "Injected Wallet (window.fiber)",
};

const PROVIDER_HINTS: Record<FiberProviderType, string> = {
  mock: "In-memory wallet. No node required. Great for demos and tests.",
  proxy: "Talks to your Fiber node through a secure server-side proxy.",
  rpc: "Direct JSON-RPC connection (server-side use).",
  injected: "A Fiber wallet injected into the page.",
};

const PERMISSIONS = [
  "View node info",
  "View channels and balances",
  "Create invoices",
  "Check payment readiness",
  "Send payments after user action",
];

export type FiberConnectModalProps = {
  open: boolean;
  onClose: () => void;
};

export function FiberConnectModal({
  open,
  onClose,
}: FiberConnectModalProps): JSX.Element | null {
  const {
    connect,
    disconnect,
    connected,
    connecting,
    error,
    availableProviders,
    grant,
  } = useFiberConnect();
  const [selected, setSelected] = useState<FiberProviderType>(
    availableProviders[0] ?? "mock",
  );

  if (!open) return null;

  async function handleConnect() {
    try {
      await connect(selected);
      onClose();
    } catch {
      // error surfaced via context
    }
  }

  return (
    <div
      className="fx-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Connect Fiber Wallet"
      onClick={onClose}
    >
      <div className="fx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fx-modal-header">
          <h2 className="fx-modal-title">Connect a Fiber Wallet</h2>
          <button
            className="fx-icon-btn"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {connected ? (
          <div className="fx-modal-body">
            <div className="fx-connected-note">
              <span className="fx-dot fx-dot-green" /> Connected via{" "}
              <strong>{grant?.providerType}</strong>
            </div>
            <button className="fx-btn fx-btn-ghost" onClick={disconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <div className="fx-modal-body">
            <p className="fx-muted">Choose how to connect:</p>
            <div className="fx-provider-list">
              {availableProviders.map((type) => (
                <button
                  key={type}
                  className={`fx-provider-option ${
                    selected === type ? "fx-provider-option-active" : ""
                  }`}
                  onClick={() => setSelected(type)}
                  aria-pressed={selected === type}
                >
                  <span className="fx-provider-label">
                    {PROVIDER_LABELS[type]}
                  </span>
                  <span className="fx-provider-hint">
                    {PROVIDER_HINTS[type]}
                  </span>
                </button>
              ))}
            </div>

            <div className="fx-permissions">
              <div className="fx-permissions-title">
                This app is requesting permission to:
              </div>
              <ul className="fx-permissions-list">
                {PERMISSIONS.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>

            {error && <div className="fx-error">{error.message}</div>}

            <button
              className="fx-btn fx-btn-primary fx-btn-block"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? "Connecting…" : "Connect"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
