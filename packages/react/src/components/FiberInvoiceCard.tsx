/**
 * FiberInvoiceCard — displays an invoice with a copy-to-clipboard control.
 */

import { useState } from "react";
import { formatUnits, type FiberCurrency } from "@fiberx/core";

export type FiberInvoiceCardProps = {
  invoiceAddress: string;
  amount?: string;
  currency?: FiberCurrency;
  description?: string;
  paymentHash?: string;
  status?: string;
};

export function FiberInvoiceCard({
  invoiceAddress,
  amount,
  currency,
  description,
  paymentHash,
  status,
}: FiberInvoiceCardProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(invoiceAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const human =
    amount && currency
      ? `${formatUnits(amount, currency.decimals ?? 0)} ${currency.code}`
      : amount;

  return (
    <div className="fx-invoice-card">
      <div className="fx-invoice-row">
        <span className="fx-label">Invoice</span>
        <div className="fx-invoice-address">
          <code>{invoiceAddress}</code>
          <button className="fx-btn fx-btn-small" onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      {human && (
        <div className="fx-invoice-row">
          <span className="fx-label">Amount</span>
          <span className="fx-value">{human}</span>
        </div>
      )}
      {description && (
        <div className="fx-invoice-row">
          <span className="fx-label">Description</span>
          <span className="fx-value">{description}</span>
        </div>
      )}
      {paymentHash && (
        <div className="fx-invoice-row">
          <span className="fx-label">Payment hash</span>
          <code className="fx-value fx-truncate">{paymentHash}</code>
        </div>
      )}
      {status && (
        <div className="fx-invoice-row">
          <span className="fx-label">Status</span>
          <span className="fx-badge fx-badge-neutral">{status}</span>
        </div>
      )}
    </div>
  );
}
