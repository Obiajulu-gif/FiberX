/**
 * FiberPaymentButton — one-click pay flow with a status modal.
 */

import { useState } from "react";
import type {
  FiberCurrency,
  GetPaymentResult,
} from "@fiberx/core";
import { useFiberConnect, useFiberPayment } from "../hooks.js";
import { FiberPaymentModal } from "./FiberPaymentModal.js";

export type FiberPaymentButtonProps = {
  invoice: string;
  amount?: string;
  currency?: FiberCurrency;
  maxFeeAmount?: string;
  label?: string;
  className?: string;
  onPaid?: (payment: GetPaymentResult) => void;
  onError?: (error: Error) => void;
};

export function FiberPaymentButton({
  invoice,
  maxFeeAmount,
  label = "Pay with Fiber",
  className,
  onPaid,
  onError,
}: FiberPaymentButtonProps): JSX.Element {
  const { connected } = useFiberConnect();
  const { phase, readiness, payment, error, pay, reset } = useFiberPayment();
  const [open, setOpen] = useState(false);

  async function handleClick() {
    setOpen(true);
    try {
      const result = await pay({ invoice, maxFeeAmount });
      if (result && result.status === "Succeeded") {
        onPaid?.(result);
      } else if (result && result.status === "Failed") {
        onError?.(new Error(result.failedError ?? "Payment failed"));
      }
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  return (
    <>
      <button
        className={`fx-btn fx-btn-primary ${className ?? ""}`}
        onClick={handleClick}
        disabled={!connected || !invoice}
      >
        {label}
      </button>
      <FiberPaymentModal
        open={open}
        phase={phase}
        readiness={readiness}
        payment={payment}
        error={error}
        onClose={handleClose}
      />
    </>
  );
}
