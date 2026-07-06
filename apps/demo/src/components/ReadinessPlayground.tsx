import { useEffect, useState } from "react";
import { useFiberConnect, useFiberReadiness } from "@fiberx/react";
import { useDemoState } from "../demo-state.js";

export function ReadinessPlayground() {
  const { connected } = useFiberConnect();
  const { readiness, checking, check } = useFiberReadiness();
  const { lastInvoice } = useDemoState();
  const [invoice, setInvoice] = useState("");

  useEffect(() => {
    if (lastInvoice) setInvoice(lastInvoice);
  }, [lastInvoice]);

  async function handleCheck() {
    await check({ invoice });
  }

  return (
    <section className="panel">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="step-pill bg-fx-amber/15 text-fx-amber">Step 3</span>
          <span className="grid h-6 w-6 place-items-center rounded-md bg-fx-cyan/20 text-xs">
            🔎
          </span>
          <h2 className="panel-title">Check payment readiness</h2>
        </div>
        <p className="text-xs leading-5 text-white/45">
          Preflight the invoice before paying so users see actionable failures first.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="eyebrow">Invoice</span>
        <input
          className="fx-input font-mono text-[13px]"
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          placeholder="fibt_mock_… or fiber:…"
          data-testid="readiness-invoice"
        />
      </label>

      <button
        className="btn-primary w-full"
        onClick={handleCheck}
        disabled={!connected || checking || !invoice}
        data-testid="check-can-pay"
      >
        {checking ? "Checking…" : "Can I pay?"}
      </button>

      {readiness && (
        <div
          className={`flex flex-col gap-1.5 rounded-xl border px-4 py-3.5 text-sm ${
            readiness.ok
              ? "border-fx-emerald/25 bg-fx-emerald/10"
              : "border-fx-rose/25 bg-fx-rose/10"
          }`}
          data-testid="readiness-output"
        >
          <div className="text-[15px] font-black text-white">
            {readiness.ok ? "✅" : "❌"} {readiness.code}
          </div>
          <div className="text-white/70">{readiness.message}</div>
          {readiness.estimatedFee && (
            <div className="text-[13px] text-white/50">
              Estimated fee: {readiness.estimatedFee} shannons
            </div>
          )}
          {readiness.routeConfidence && (
            <div className="text-[13px] text-white/50">
              Route confidence: {readiness.routeConfidence}
            </div>
          )}
          {readiness.recommendedAction && (
            <div className="mt-1 text-[13px] font-semibold text-white/80">
              Recommended action: {readiness.recommendedAction}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
