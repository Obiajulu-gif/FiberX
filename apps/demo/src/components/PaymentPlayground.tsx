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
    <section className="panel">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-fx-emerald/20 text-xs">
          ⚡
        </span>
        <h2 className="panel-title">Payment playground</h2>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="eyebrow">Invoice</span>
        <input
          className="fx-input font-mono text-[13px]"
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          placeholder="fibt_mock_…"
          data-testid="payment-invoice"
        />
      </label>

      <button
        className="btn-primary w-full"
        onClick={handlePay}
        disabled={!connected || !invoice}
        data-testid="pay-invoice"
      >
        Pay invoice
      </button>

      {payment && phase !== "idle" && (
        <div
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5"
          data-testid="payment-status"
        >
          <span className="eyebrow">Latest status</span>
          <span className={`chip ${statusChip(payment.status)}`}>
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

function statusChip(status: string): string {
  switch (status) {
    case "Succeeded":
      return "bg-fx-emerald/15 text-fx-emerald";
    case "Failed":
      return "bg-fx-rose/15 text-fx-rose";
    case "Pending":
    case "Created":
      return "bg-fx-amber/15 text-fx-amber";
    default:
      return "bg-white/10 text-white/60";
  }
}
