import { DemoStateProvider } from "./demo-state.js";
import { EventLogProvider, EventLog } from "./components/EventLog.js";
import { DemoHeader } from "./components/DemoHeader.js";
import { ConnectPanel } from "./components/ConnectPanel.js";
import { ChannelPanel } from "./components/ChannelPanel.js";
import { InvoicePlayground } from "./components/InvoicePlayground.js";
import { ReadinessPlayground } from "./components/ReadinessPlayground.js";
import { PaymentPlayground } from "./components/PaymentPlayground.js";

export function App() {
  return (
    <DemoStateProvider>
      <EventLogProvider>
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:pt-10">
          <DemoHeader />

          <main className="flex flex-col gap-8">
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <ConnectPanel />
              <ChannelPanel />
            </section>

            <section className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.025] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
                <div>
                  <span className="step-pill bg-fx-violet/15 text-fx-violet-400">
                    Main demo flow
                  </span>
                  <h2 className="mt-3 text-xl font-black tracking-tight text-white">
                    Create, check, and pay a Fiber invoice
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">
                    Use these cards from left to right. The invoice is copied into
                    the readiness and payment steps automatically.
                  </p>
                </div>
                <div className="w-fit rounded-2xl border border-fx-emerald/20 bg-fx-emerald/10 px-4 py-2 text-xs font-bold text-fx-emerald">
                  Mock mode · no node needed
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <InvoicePlayground />
                <ReadinessPlayground />
                <PaymentPlayground />
              </div>
            </section>

            <EventLog />
          </main>

          <footer className="mt-12 text-center text-xs text-white/35">
            FiberX · Fiber Wallet Connect SDK · Wallet &amp; Payment UX
            Infrastructure ·{" "}
            <a
              className="text-fx-violet-400 hover:text-white"
              href="https://github.com/Obiajulu-gif/FiberX"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </footer>
        </div>
      </EventLogProvider>
    </DemoStateProvider>
  );
}
