/**
 * FiberPaymentModal — visualises the pay flow phases.
 */

import type { GetPaymentResult, PaymentReadinessResult } from "@fiberx/core";
import type { PaymentPhase } from "../hooks.js";
import { FiberReadinessBadge } from "./FiberReadinessBadge.js";

export type FiberPaymentModalProps = {
  open: boolean;
  phase: PaymentPhase;
  readiness?: PaymentReadinessResult;
  payment?: GetPaymentResult;
  error?: Error;
  onClose: () => void;
};

const PHASE_TEXT: Record<PaymentPhase, string> = {
  idle: "Ready",
  checking: "Checking readiness…",
  ready: "Ready to pay — sending…",
  pending: "Payment pending…",
  succeeded: "Payment succeeded 🎉",
  failed: "Payment failed",
};

export function FiberPaymentModal({
  open,
  phase,
  readiness,
  payment,
  error,
  onClose,
}: FiberPaymentModalProps): JSX.Element | null {
  if (!open) return null;

  const isBusy = phase === "checking" || phase === "ready" || phase === "pending";

  return (
    <div
      className="fx-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Fiber payment"
      onClick={phase === "succeeded" || phase === "failed" ? onClose : undefined}
    >
      <div className="fx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fx-modal-header">
          <h2 className="fx-modal-title">Fiber Payment</h2>
          <button className="fx-icon-btn" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="fx-modal-body">
          <div className={`fx-pay-status fx-pay-${phase}`}>
            {isBusy && <span className="fx-spinner" />}
            <span className="fx-pay-status-text">{PHASE_TEXT[phase]}</span>
          </div>

          <ol className="fx-pay-steps">
            <Step label="Check readiness" done={phase !== "idle" && phase !== "checking"} active={phase === "checking"} />
            <Step label="Send payment" done={phase === "pending" || phase === "succeeded"} active={phase === "ready"} />
            <Step label="Settle" done={phase === "succeeded"} active={phase === "pending"} />
          </ol>

          {phase === "failed" && (
            <div className="fx-error">
              {readiness && !readiness.ok ? (
                <FiberReadinessBadge readiness={readiness} />
              ) : (
                <span>
                  {payment?.failedError ??
                    error?.message ??
                    "The payment could not be completed."}
                </span>
              )}
            </div>
          )}

          {phase === "succeeded" && payment && (
            <div className="fx-pay-receipt">
              <div>
                <span className="fx-label">Payment hash</span>
                <code className="fx-truncate">{payment.paymentHash}</code>
              </div>
              {payment.fee && (
                <div>
                  <span className="fx-label">Fee</span>
                  <span>{payment.fee}</span>
                </div>
              )}
              {payment.preimage && (
                <div>
                  <span className="fx-label">Preimage</span>
                  <code className="fx-truncate">{payment.preimage}</code>
                </div>
              )}
            </div>
          )}

          {(phase === "succeeded" || phase === "failed") && (
            <button
              className="fx-btn fx-btn-primary fx-btn-block"
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({
  label,
  done,
  active,
}: {
  label: string;
  done: boolean;
  active: boolean;
}): JSX.Element {
  return (
    <li
      className={`fx-pay-step ${done ? "fx-pay-step-done" : ""} ${
        active ? "fx-pay-step-active" : ""
      }`}
    >
      <span className="fx-pay-step-marker">{done ? "✓" : "•"}</span>
      {label}
    </li>
  );
}
