import { Link } from "react-router-dom";
import { TopNav } from "../components/TopNav.js";
import { LogoMark } from "../components/Logo.js";

const FEATURES = [
  {
    icon: "🔌",
    title: "Wallet connect modal",
    body: "A permissioned, WebLN-style connect flow. Mock, proxy, or injected providers behind one interface.",
    accent: "violet",
  },
  {
    icon: "🧾",
    title: "Invoices & requests",
    body: "Create Fiber invoices and encode shareable fiber: payment requests with a single call.",
    accent: "cyan",
  },
  {
    icon: "🔎",
    title: "Readiness checks",
    body: "“Can I pay?” preflight returns actionable codes — capacity, asset support, fees — before you send.",
    accent: "amber",
  },
  {
    icon: "⚡",
    title: "Payment status UI",
    body: "Drop-in pay button + modal that streams created → pending → succeeded with human-readable failures.",
    accent: "emerald",
  },
  {
    icon: "🛡️",
    title: "Secure proxy",
    body: "Keep the node RPC URL and key server-side. A curated Fastify allow-list — no raw RPC passthrough.",
    accent: "violet",
  },
  {
    icon: "💠",
    title: "Multi-asset ready",
    body: "CKB, RGB++ assets and stablecoins like RUSD are first-class in the channel and balance model.",
    accent: "cyan",
  },
];

const STEPS = [
  { n: "01", t: "Wrap your app", d: "Add <FiberConnectProvider> once at the root." },
  { n: "02", t: "Connect", d: "Drop in <FiberConnectButton /> for a permissioned wallet link." },
  { n: "03", t: "Check readiness", d: "Call provider.canPay() and show the diagnostic badge." },
  { n: "04", t: "Pay", d: "Use <FiberPaymentButton /> and watch the status modal settle." },
];

const CODE = `import {
  FiberConnectProvider,
  FiberConnectButton,
  FiberPaymentButton,
  useFiberConnect
} from "@fiberx/react";

function Checkout({ invoice }) {
  const { connected } = useFiberConnect();
  return (
    <>
      <FiberConnectButton />
      <FiberPaymentButton
        invoice={invoice}
        onPaid={(p) => console.log("paid", p)}
      />
    </>
  );
}`;

const ACCENT: Record<string, string> = {
  violet: "from-fx-violet/25 to-transparent text-fx-violet-400",
  cyan: "from-fx-cyan/20 to-transparent text-fx-cyan",
  amber: "from-fx-amber/20 to-transparent text-fx-amber",
  emerald: "from-fx-emerald/20 to-transparent text-fx-emerald",
};

export function Landing() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6">
      <TopNav />

      {/* Hero */}
      <section className="relative isolate pt-6 text-center sm:pt-12">
        <div className="grid-texture pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/70 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-fx-emerald" />
          Fiber Network Infrastructure · Wallet &amp; Payment UX
        </div>

        <div className="mb-6 flex justify-center">
          <div className="floaty glow-ring grid h-24 w-24 place-items-center rounded-[28px]">
            <LogoMark size={96} />
          </div>
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
          The <span className="text-gradient-violet">wallet connect</span> layer
          for Fiber Network
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
          FiberX is a drop-in TypeScript SDK and React component library for
          connecting wallets, creating invoices, checking payment readiness, and
          settling Fiber payments — with a beautiful liquid-glass UI out of the box.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/dashboard" className="btn-primary px-6 py-3 text-base">
            Launch live dashboard →
          </Link>
          <a
            className="btn-ghost px-6 py-3 text-base"
            href="https://github.com/Obiajulu-gif/FiberX"
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
          </a>
        </div>

        <div className="mt-4 text-xs text-white/40">
          No wallet or node required — runs fully in mock mode.
        </div>
      </section>

      {/* Stat strip */}
      <section className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["8", "SDK provider methods"],
          ["4", "workspace packages"],
          ["52", "tests passing"],
          ["3", "asset types modeled"],
        ].map(([v, l]) => (
          <div key={l} className="lg-card px-5 py-5 text-center">
            <div className="text-3xl font-black text-gradient-violet">{v}</div>
            <div className="mt-1 text-xs font-semibold text-white/55">{l}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="mt-20">
        <SectionHead
          eyebrow="Toolkit"
          title="Everything you need to accept Fiber payments"
          sub="Reusable infrastructure that other wallets, merchants and developers can build on."
        />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="lg-card lg-card-hover p-6">
              <div
                className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-xl ${ACCENT[f.accent]}`}
              >
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works + code */}
      <section className="mt-20 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="lg-card p-7">
          <SectionHead
            eyebrow="Integrate in minutes"
            title="Four steps to a working checkout"
            align="left"
          />
          <ol className="mt-6 flex flex-col gap-5">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="mt-0.5 font-mono text-sm font-bold text-fx-violet-400">
                  {s.n}
                </span>
                <div>
                  <div className="font-bold text-white">{s.t}</div>
                  <div className="text-sm text-white/55">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg-card overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b border-white/10 bg-black/30 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-fx-rose/70" />
            <span className="h-3 w-3 rounded-full bg-fx-amber/70" />
            <span className="h-3 w-3 rounded-full bg-fx-emerald/70" />
            <span className="ml-2 font-mono text-xs text-white/40">
              Checkout.tsx
            </span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-6 text-white/80">
            <code>{CODE}</code>
          </pre>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20">
        <div className="lg-card relative overflow-hidden p-10 text-center">
          <div className="aurora-orb !left-1/2 !top-0 !-translate-x-1/2 opacity-40" />
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            Try the <span className="text-gradient-violet">live dashboard</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            Connect a mock wallet, mint an invoice, run a readiness check and
            settle a payment — end to end, right in your browser.
          </p>
          <Link
            to="/dashboard"
            className="btn-primary mt-7 inline-flex px-7 py-3 text-base"
          >
            Open the dashboard →
          </Link>
        </div>
      </section>

      <footer className="mt-16 flex flex-col items-center gap-3 text-center text-xs text-white/40">
        <LogoMark size={28} />
        <div>
          FiberX · Fiber Wallet Connect SDK · built for the Gone in 60ms
          hackathon ·{" "}
          <a
            className="text-fx-violet-400 hover:text-white"
            href="https://github.com/Obiajulu-gif/FiberX"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <span className="step-pill bg-fx-violet/15 text-fx-violet-400">
        {eyebrow}
      </span>
      <h2
        className={`mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl ${
          align === "center" ? "mx-auto max-w-2xl" : ""
        }`}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-3 text-sm text-white/55 ${
            align === "center" ? "mx-auto max-w-xl" : ""
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
