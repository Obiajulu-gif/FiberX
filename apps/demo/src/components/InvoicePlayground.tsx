import { useState } from "react";
import { useFiberConnect, useFiberInvoice, FiberInvoiceCard } from "@fiberx/react";
import { CURRENCIES, parseUnits, type CurrencyCode } from "../units.js";
import { useDemoState } from "../demo-state.js";

export function InvoicePlayground() {
  const { connected } = useFiberConnect();
  const { invoice, creating, error, create } = useFiberInvoice();
  const { setLastInvoice } = useDemoState();

  const [amount, setAmount] = useState("1");
  const [currency, setCurrency] = useState<CurrencyCode>("CKB");
  const [description, setDescription] = useState("Coffee");
  const [localError, setLocalError] = useState<string | undefined>();

  async function handleCreate() {
    setLocalError(undefined);
    try {
      const base = parseUnits(amount, CURRENCIES[currency].decimals);
      const result = await create({
        amount: base,
        currency: CURRENCIES[currency],
        description,
      });
      setLastInvoice(result.invoiceAddress);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Invoice playground</h2>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field-label">Amount</span>
          <input
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            data-testid="invoice-amount"
            inputMode="decimal"
          />
        </label>
        <label className="field">
          <span className="field-label">Currency</span>
          <select
            className="input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            data-testid="invoice-currency"
          >
            <option value="CKB">CKB</option>
            <option value="RUSD">RUSD</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span className="field-label">Description</span>
        <input
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          data-testid="invoice-description"
        />
      </label>

      <button
        className="fx-btn fx-btn-primary"
        onClick={handleCreate}
        disabled={!connected || creating}
        data-testid="create-invoice"
      >
        {creating ? "Creating…" : "Create invoice"}
      </button>

      {(localError || error) && (
        <div className="fx-error">{localError ?? error?.message}</div>
      )}

      {invoice && (
        <div data-testid="invoice-output" style={{ marginTop: 12 }}>
          <FiberInvoiceCard
            invoiceAddress={invoice.invoiceAddress}
            amount={parseUnits(amount, CURRENCIES[currency].decimals)}
            currency={CURRENCIES[currency]}
            description={description}
            paymentHash={invoice.paymentHash}
            status={invoice.status}
          />
        </div>
      )}
    </section>
  );
}
