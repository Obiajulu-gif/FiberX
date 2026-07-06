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
          at: new Date().toLocaleTimeString(),
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
        push("connect", `Connected via ${g.providerType} (${g.network})`),
      ),
      provider.on("disconnect", (d) =>
        push("disconnect", `Disconnected ${d.providerType}`),
      ),
      provider.on("invoice:created", (inv) =>
        push("invoice:created", inv.invoiceAddress),
      ),
      provider.on("readiness:checked", (r) =>
        push("readiness:checked", `${r.code} — ${r.message}`),
      ),
      provider.on("payment:created", (p) =>
        push("payment:created", p.paymentHash),
      ),
      provider.on("payment:pending", (p) =>
        push("payment:pending", p.paymentHash),
      ),
      provider.on("payment:succeeded", (p) =>
        push("payment:succeeded", p.paymentHash),
      ),
      provider.on("payment:failed", (p) =>
        push("payment:failed", p.failedError ?? p.paymentHash),
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

const KIND_CHIP: Record<string, string> = {
  connect: "bg-fx-emerald/15 text-fx-emerald",
  disconnect: "bg-white/10 text-white/60",
  "invoice:created": "bg-fx-violet/20 text-fx-violet-400",
  "readiness:checked": "bg-fx-amber/15 text-fx-amber",
  "payment:created": "bg-fx-cyan/15 text-fx-cyan",
  "payment:pending": "bg-fx-cyan/15 text-fx-cyan",
  "payment:succeeded": "bg-fx-emerald/15 text-fx-emerald",
  "payment:failed": "bg-fx-rose/15 text-fx-rose",
};

export function EventLog() {
  const { entries, clear } = useEventLog();
  return (
    <section className="panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-white/10 text-xs">
            📡
          </span>
          <h2 className="panel-title">Event log</h2>
          {entries.length > 0 && (
            <span className="chip bg-white/10 text-white/50">
              {entries.length}
            </span>
          )}
        </div>
        <button className="btn-ghost px-3 py-1.5 text-xs" onClick={clear}>
          Clear
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-white/45">
          No events yet. Connect a wallet to see SDK events stream in.
        </p>
      ) : (
        <ul
          className="flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1"
          data-testid="event-log"
        >
          {entries.map((e) => (
            <li
              key={e.id}
              className="grid grid-cols-[64px_150px_1fr] items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2"
            >
              <span className="font-mono text-[11px] tabular-nums text-white/40">
                {e.at}
              </span>
              <span
                className={`chip justify-center ${KIND_CHIP[e.kind] ?? "bg-white/10 text-white/60"}`}
              >
                {e.kind}
              </span>
              <span className="truncate font-mono text-[12px] text-white/70">
                {e.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
