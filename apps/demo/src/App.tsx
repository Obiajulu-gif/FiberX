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
        <div className="demo-root">
          <DemoHeader />
          <main className="demo-main">
            <div className="grid">
              <div className="col">
                <ConnectPanel />
                <ChannelPanel />
              </div>
              <div className="col">
                <InvoicePlayground />
                <ReadinessPlayground />
                <PaymentPlayground />
              </div>
            </div>
            <EventLog />
          </main>
          <footer className="demo-footer">
            <span>
              FiberX · Fiber Wallet Connect SDK · Wallet &amp; Payment UX
              Infrastructure
            </span>
          </footer>
        </div>
      </EventLogProvider>
    </DemoStateProvider>
  );
}
