import { FiberConnectButton, useFiberConnect } from "@fiberx/react";

export function DemoHeader() {
  const { connected, grant } = useFiberConnect();

  return (
    <header className="mb-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-fx-violet to-fx-violet-600 text-lg font-black text-white shadow-lg shadow-fx-violet/40">
            FX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                FiberX
              </h1>
              <span className="chip bg-white/10 text-white/70">
                Wallet Connect SDK
              </span>
            </div>
            <p className="mt-1 max-w-xl text-sm text-white/55">
              Drop-in wallet connection, invoices, readiness checks, and payment
              status UI for Fiber Network apps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`chip ${
              connected
                ? "bg-fx-emerald/15 text-fx-emerald"
                : "bg-fx-amber/15 text-fx-amber"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-fx-emerald" : "bg-fx-amber"
              }`}
            />
            {connected ? `${grant?.providerType ?? "wallet"} · live` : "not connected"}
          </span>
          <FiberConnectButton />
        </div>
      </div>
    </header>
  );
}
