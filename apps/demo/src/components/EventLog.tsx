import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useFiberConnect } from "@fiberx/react";

export type LogEntry = {
  id: number;
  at: string;
  kind: string;
  message: string;
};

type EventLogContextValue = {
  entries: LogEntry[];
  push: (kind: string, message: string) => void;
  clear: () => void;
};

const EventLogContext = createContext<EventLogContextValue | null>(null);

export function EventLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const { provider } = useFiberConnect();

  const push = useCallback((kind: string, message: string) => {
    setEntries((prev) =>
      [
        {
          id: prev.length ? prev[0].id + 1 : 1,
          at: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          kind,
          message,
        },
        ...prev,
      ].slice(0, 100),
    );
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  useEffect(() => {
    if (!provider) return;
    const offs = [
      provider.on("connect", (g) =>
        push("connect", `Connected via ${g.providerType} on ${g.network}`),
      ),
      provider.on("disconnect", (d) =>
        push("disconnect", `Disconnected ${d.providerType}`),
      ),
      provider.on("invoice:created", (inv) =>
        push("invoice:created", `Invoice ready: ${shorten(inv.invoiceAddress)}`),
      ),
      provider.on("readiness:checked", (r) =>
        push("readiness:checked", `${r.code}: ${r.message}`),
      ),
      provider.on("payment:created", (p) =>
        push("payment:created", `Payment created: ${shorten(p.paymentHash)}`),
      ),
      provider.on("payment:pending", (p) =>
        push("payment:pending", `Payment pending: ${shorten(p.paymentHash)}`),
      ),
      provider.on("payment:succeeded", (p) =>
        push("payment:succeeded", `Payment succeeded: ${shorten(p.paymentHash)}`),
      ),
      provider.on("payment:failed", (p) =>
        push("payment:failed", p.failedError ?? `Failed: ${shorten(p.paymentHash)}`),
      ),
    ];
    return () => offs.forEach((off) => off());
  }, [provider, push]);

  const value = useMemo(
    () => ({ entries, push, clear }),
    [entries, push, clear],
  );

  return (
    <EventLogContext.Provider value={value}>
      {children}
    </EventLogContext.Provider>
  );
}

export function useEventLog(): EventLogContextValue {
  const ctx = useContext(EventLogContext);
  if (!ctx) throw new Error("useEventLog must be used inside EventLogProvider");
  return ctx;
}

type KindMeta = {
  label: string;
  icon: string;
  chip: string;
  dot: string;
};

const KIND_META: Record<string, KindMeta> = {
  connect: {
    label: "Connected",
    icon: "🔌",
    chip: "bg-fx-emerald/15 text-fx-emerald",
    dot: "bg-fx-emerald/20 text-fx-emerald ring-fx-emerald/20",
  },
  disconnect: {
    label: "Disconnected",
    icon: "⏻",
    chip: "bg-white/10 text-white/60",
    dot: "bg-white/10 text-white/60 ring-white/10",
  },
  "invoice:created": {
    label: "Invoice",
    icon: "🧾",
    chip: "bg-fx-violet/20 text-fx-violet-400",
    dot: "bg-fx-violet/20 text-fx-violet-400 ring-fx-violet/20",
  },
  "readiness:checked": {
    label: "Readiness",
    icon: "🔎",
    chip: "bg-fx-amber/15 text-fx-amber",
    dot: "bg-fx-amber/15 text-fx-amber ring-fx-amber/20",
  },
  "payment:created": {
    label: "Payment created",
    icon: "⚡",
    chip: "bg-fx-cyan/15 text-fx-cyan",
    dot: "bg-fx-cyan/15 text-fx-cyan ring-fx-cyan/20",
  },
  "payment:pending": {
    label: "Payment pending",
    icon: "⏳",
    chip: "bg-fx-cyan/15 text-fx-cyan",
    dot: "bg-fx-cyan/15 text-fx-cyan ring-fx-cyan/20",
  },
  "payment:succeeded": {
    label: "Payment succeeded",
    icon: "✓",
    chip: "bg-fx-emerald/15 text-fx-emerald",
    dot: "bg-fx-emerald/20 text-fx-emerald ring-fx-emerald/20",
  },
  "payment:failed": {
    label: "Payment failed",
    icon: "!",
    chip: "bg-fx-rose/15 text-fx-rose",
    dot: "bg-fx-rose/15 text-fx-rose ring-fx-rose/20",
  },
};

const DEFAULT_META: KindMeta = {
  label: "Event",
  icon: "•",
  chip: "bg-white/10 text-white/60",
  dot: "bg-white/10 text-white/60 ring-white/10",
};

export function EventLog() {
  const { entries, clear } = useEventLog();
  const paymentEvents = entries.filter((e) => e.kind.startsWith("payment:")).length;
  const successEvents = entries.filter(
    (e) => e.kind === "payment:succeeded" || e.kind === "connect",
  ).length;
  const latest = entries[0];

  return (
    <section className="panel overflow-hidden" aria-labelledby="event-log-title">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fx-emerald opacity-35" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-fx-emerald" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-fx-emerald">
              Live monitor
            </span>
          </div>
          <h2 id="event-log-title" className="text-lg font-black text-white">
            SDK event timeline
          </h2>
          <p className="mt-1 text-xs leading-5 text-white/50">
            Every wallet, invoice, readiness, and payment callback appears here
            so judges can verify the SDK is doing real work.
          </p>
        </div>
        <button
          className="btn-ghost shrink-0 px-3 py-1.5 text-xs"
          onClick={clear}
          disabled={entries.length === 0}
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric label="Events" value={entries.length} />
        <Metric label="Payments" value={paymentEvents} />
        <Metric label="Success" value={successEvents} />
      </div>

      {latest && (
        <div className="rounded-2xl border border-fx-violet/20 bg-fx-violet/10 px-3.5 py-3">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-fx-violet-400">
            Latest callback
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-white">
            {(KIND_META[latest.kind] ?? DEFAULT_META).label}
          </div>
          <div className="mt-1 truncate font-mono text-[12px] text-white/55">
            {latest.message}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="event-scroll -mr-1 max-h-[34rem] overflow-y-auto pr-1"
          aria-live="polite"
        >
          <ul
            className="relative flex flex-col gap-3 before:absolute before:bottom-3 before:left-[18px] before:top-3 before:w-px before:bg-white/10"
            data-testid="event-log"
          >
            {entries.map((entry) => (
              <EventItem key={entry.id} entry={entry} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function EventItem({ entry }: { entry: LogEntry }) {
  const meta = KIND_META[entry.kind] ?? DEFAULT_META;
  return (
    <li className="relative flex gap-3">
      <span
        className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm ring-4 ${meta.dot}`}
        aria-hidden="true"
      >
        {meta.icon}
      </span>
      <article className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/22 px-3.5 py-3 shadow-[0_14px_40px_-28px_rgba(0,0,0,0.9)] transition hover:border-white/20 hover:bg-white/[0.045]">
        <div className="flex items-center justify-between gap-3">
          <span className={`chip ${meta.chip}`}>{meta.label}</span>
          <time className="shrink-0 font-mono text-[11px] tabular-nums text-white/35">
            {entry.at}
          </time>
        </div>
        <p
          className="mt-2 truncate font-mono text-[12px] leading-5 text-white/68"
          title={entry.message}
        >
          {entry.message}
        </p>
      </article>
    </li>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2.5">
      <div className="text-lg font-black leading-none text-white">{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/38">
        {label}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/14 bg-black/18 px-4 py-5 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white/8 text-lg">
        📡
      </div>
      <h3 className="mt-3 text-sm font-black text-white">Waiting for SDK events</h3>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-white/48">
        Connect the mock wallet, create an invoice, check readiness, then pay.
        The timeline will fill with real provider events.
      </p>
    </div>
  );
}

function shorten(value: string): string {
  if (value.length <= 28) return value;
  return `${value.slice(0, 16)}…${value.slice(-8)}`;
}
