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
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6">
          <DemoHeader />
          <main className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-5">
                <ConnectPanel />
                <ChannelPanel />
              </div>
              <div className="flex flex-col gap-5">
                <InvoicePlayground />
                <ReadinessPlayground />
                <PaymentPlayground />
              </div>
            </div>
            <EventLog />
          </main>
          <footer className="mt-10 text-center text-xs text-white/35">
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
