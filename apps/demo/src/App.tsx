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
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6">
          <DemoHeader />
          <main className="flex flex-col gap-5">
            <JudgeWalkthrough />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(340px,0.72fr)]">
              <section className="flex min-w-0 flex-col gap-5">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                  <ConnectPanel />
                  <ChannelPanel />
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <InvoicePlayground />
                  <ReadinessPlayground />
                </div>

                <PaymentPlayground />
              </section>

              <aside className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-6 xl:self-start">
                <EventLog />
                <JudgeChecklist />
              </aside>
            </div>
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

function JudgeWalkthrough() {
  const steps = [
    {
      title: "Connect",
      body: "Choose Mock Fiber Wallet. No Fiber node or external service is required.",
      tone: "bg-fx-violet/15 text-fx-violet-400",
    },
    {
      title: "Create invoice",
      body: "Generate a 1 CKB mock Fiber invoice and copy/inspect the output.",
      tone: "bg-fx-cyan/15 text-fx-cyan",
    },
    {
      title: "Check readiness",
      body: "Run the “Can I pay?” preflight check before sending funds.",
      tone: "bg-fx-amber/15 text-fx-amber",
    },
    {
      title: "Pay + verify",
      body: "Send the mock payment and watch SDK events stream into the monitor.",
      tone: "bg-fx-emerald/15 text-fx-emerald",
    },
  ];

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-fx-violet/25 bg-fx-violet/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-fx-violet-400">
            Judge walkthrough
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Test the full Fiber wallet flow in under two minutes
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">
            The demo is arranged in the same order a developer or judge should try
            it: connect a provider, create an invoice, check payment readiness,
            then send a payment and verify the emitted SDK events.
          </p>
        </div>
        <div className="rounded-2xl border border-fx-emerald/20 bg-fx-emerald/10 px-4 py-3 text-sm text-fx-emerald">
          <div className="font-black">Mock mode is fully runnable</div>
          <div className="mt-1 text-xs leading-5 text-white/55">
            Real Fiber RPC is optional through the proxy adapter.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${step.tone}`}
              >
                {index + 1}
              </span>
              <h3 className="text-sm font-black text-white">{step.title}</h3>
            </div>
            <p className="text-xs leading-5 text-white/55">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function JudgeChecklist() {
  return (
    <section className="panel gap-3">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-fx-amber/15 text-xs">
          ✅
        </span>
        <h2 className="panel-title">What judges can verify</h2>
      </div>
      <ul className="flex flex-col gap-2 text-sm text-white/58">
        <ChecklistItem>Connect modal + provider permission flow</ChecklistItem>
        <ChecklistItem>Invoice creation and reusable invoice output</ChecklistItem>
        <ChecklistItem>READY and insufficient-capacity readiness states</ChecklistItem>
        <ChecklistItem>Payment modal with pending → succeeded lifecycle</ChecklistItem>
        <ChecklistItem>Live SDK event stream for debugging/integration</ChecklistItem>
      </ul>
      <div className="rounded-xl border border-fx-rose/20 bg-fx-rose/10 px-3.5 py-3 text-xs leading-5 text-white/60">
        Try the failure case: create an invoice for <strong className="text-fx-rose">999999 CKB</strong>,
        then run <strong className="text-white/80">Can I pay?</strong>.
      </div>
    </section>
  );
}

function ChecklistItem({ children }: { children: string }) {
  return (
    <li className="flex gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fx-emerald" />
      <span>{children}</span>
    </li>
  );
}
