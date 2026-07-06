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
    <section className="panel">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="step-pill bg-fx-cyan/15 text-fx-cyan">Step 2</span>
          <span className="grid h-6 w-6 place-items-center rounded-md bg-fx-violet/20 text-xs">
            🧾
          </span>
          <h2 className="panel-title">Create a Fiber invoice</h2>
        </div>
        <p className="text-xs leading-5 text-white/45">
          Generate a payment request that downstream apps can parse, show, and pay.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_130px] gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Amount</span>
          <input
            className="fx-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            data-testid="invoice-amount"
            inputMode="decimal"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Currency</span>
          <select
            className="fx-input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            data-testid="invoice-currency"
          >
            <option value="CKB">CKB</option>
            <option value="RUSD">RUSD</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="eyebrow">Description</span>
        <input
          className="fx-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          data-testid="invoice-description"
        />
      </label>

      <button
        className="btn-primary w-full"
        onClick={handleCreate}
        disabled={!connected || creating}
        data-testid="create-invoice"
      >
        {creating ? "Creating…" : "Create invoice"}
      </button>

      {(localError || error) && (
        <div className="rounded-xl bg-fx-rose/15 px-3.5 py-2.5 text-sm text-fx-rose">
          {localError ?? error?.message}
        </div>
      )}

      {invoice && (
        <div data-testid="invoice-output">
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
