import { useEffect, useState } from "react";
import {
  useFiberConnect,
  useFiberPayment,
  FiberPaymentModal,
} from "@fiberx/react";
import { useDemoState } from "../demo-state.js";

export function PaymentPlayground() {
  const { connected } = useFiberConnect();
  const { phase, readiness, payment, error, pay, reset } = useFiberPayment();
  const { lastInvoice } = useDemoState();
  const [invoice, setInvoice] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (lastInvoice) setInvoice(lastInvoice);
  }, [lastInvoice]);

  async function handlePay() {
    setOpen(true);
    await pay({ invoice, timeoutSeconds: 30 });
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Payment playground</h2>
      </div>

      <label className="field">
        <span className="field-label">Invoice</span>
        <input
          className="input"
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          placeholder="fibt_mock_…"
          data-testid="payment-invoice"
        />
      </label>

      <button
        className="fx-btn fx-btn-primary"
        onClick={handlePay}
        disabled={!connected || !invoice}
        data-testid="pay-invoice"
      >
        Pay invoice
      </button>

      {payment && phase !== "idle" && (
        <div className="pay-status-card" data-testid="payment-status">
          <span className="field-label">Latest status</span>
          <span className={`fx-badge fx-badge-${statusTone(payment.status)}`}>
            {payment.status}
          </span>
        </div>
      )}

      <FiberPaymentModal
        open={open}
        phase={phase}
        readiness={readiness}
        payment={payment}
        error={error}
        onClose={handleClose}
      />
    </section>
  );
}

function statusTone(status: string): string {
  switch (status) {
    case "Succeeded":
      return "green";
    case "Failed":
      return "red";
    case "Pending":
    case "Created":
      return "yellow";
    default:
      return "neutral";
  }
}
