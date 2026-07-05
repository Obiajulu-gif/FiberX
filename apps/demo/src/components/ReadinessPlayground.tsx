import { useEffect, useState } from "react";
import { useFiberConnect, useFiberReadiness } from "@fiberx/react";
import { useDemoState } from "../demo-state.js";

export function ReadinessPlayground() {
  const { connected } = useFiberConnect();
  const { readiness, checking, check } = useFiberReadiness();
  const { lastInvoice } = useDemoState();
  const [invoice, setInvoice] = useState("");

  // Prefill from the most recently created invoice.
  useEffect(() => {
    if (lastInvoice) setInvoice(lastInvoice);
  }, [lastInvoice]);

  async function handleCheck() {
    await check({ invoice });
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Payment readiness — “Can I pay?”</h2>
      </div>

      <label className="field">
        <span className="field-label">Invoice</span>
        <input
          className="input"
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          placeholder="fibt_mock_… or fiber:…"
          data-testid="readiness-invoice"
        />
      </label>

      <button
        className="fx-btn fx-btn-primary"
        onClick={handleCheck}
        disabled={!connected || checking || !invoice}
        data-testid="check-can-pay"
      >
        {checking ? "Checking…" : "Can I pay?"}
      </button>

      {readiness && (
        <div
          className={`readiness-output ${readiness.ok ? "ok" : "bad"}`}
          data-testid="readiness-output"
        >
          <div className="readiness-headline">
            {readiness.ok ? "✅" : "❌"} {readiness.code}
          </div>
          <div className="readiness-message">{readiness.message}</div>
          {readiness.estimatedFee && (
            <div className="readiness-line">
              Estimated fee: {readiness.estimatedFee} shannons
            </div>
          )}
          {readiness.routeConfidence && (
            <div className="readiness-line">
              Route confidence: {readiness.routeConfidence}
            </div>
          )}
          {readiness.recommendedAction && (
            <div className="readiness-action">
              Recommended action: {readiness.recommendedAction}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
