import { useEffect, useState } from "react";
import { useFiberConnect } from "@fiberx/react";
import { DemoStateProvider } from "../demo-state.js";
import { EventLogProvider, EventLog } from "../components/EventLog.js";
import { TopNav } from "../components/TopNav.js";
import { ConnectPanel } from "../components/ConnectPanel.js";
import { ChannelPanel } from "../components/ChannelPanel.js";
import { InvoicePlayground } from "../components/InvoicePlayground.js";
import { ReadinessPlayground } from "../components/ReadinessPlayground.js";
import { PaymentPlayground } from "../components/PaymentPlayground.js";
import type { FiberBalance } from "@fiberx/core";
import { formatUnits } from "@fiberx/core";

export function Dashboard() {
  return (
    <DemoStateProvider>
      <EventLogProvider>
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-5 sm:px-6">
          <TopNav />

          <DashboardHero />

          <main className="mt-8 flex flex-col gap-8">
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
                    Use these cards from left to right. The invoice is copied
                    into the readiness and payment steps automatically.
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

function DashboardHero() {
  const { connected, provider, grant } = useFiberConnect();
  const [balance, setBalance] = useState<FiberBalance | undefined>();

  useEffect(() => {
    let active = true;
    if (connected && provider) {
      provider
        .getBalance()
        .then((b) => active && setBalance(b))
        .catch(() => active && setBalance(undefined));
    } else {
      setBalance(undefined);
    }
    return () => {
      active = false;
    };
  }, [connected, provider]);

  const ckb = balance?.byCurrency.find((c) => c.currency.code === "CKB");
  const readyCkb = ckb ? formatUnits(ckb.readyLocalBalance, 8) : "—";

  return (
    <section className="lg-card relative overflow-hidden p-6 sm:p-8">
      <div className="aurora-orb !left-auto !right-0 !top-[-20%] opacity-30" />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="step-pill bg-fx-emerald/15 text-fx-emerald">
            Live control room
          </span>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            FiberX Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
            Connect a wallet, inspect channels, and run the full invoice →
            readiness → payment lifecycle powered by the FiberX SDK.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <HeroStat
            label="Status"
            value={connected ? "Online" : "Offline"}
            tone={connected ? "emerald" : "muted"}
          />
          <HeroStat
            label="Provider"
            value={connected ? (grant?.providerType ?? "—") : "—"}
            tone="violet"
          />
          <HeroStat label="Ready CKB" value={readyCkb} tone="cyan" />
        </div>
      </div>
    </section>
  );
}

const TONES: Record<string, string> = {
  emerald: "text-fx-emerald",
  violet: "text-fx-violet-400",
  cyan: "text-fx-cyan",
  muted: "text-white/50",
};

function HeroStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-center">
      <div className={`text-base font-black ${TONES[tone]}`}>{value}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
        {label}
      </div>
    </div>
  );
}
