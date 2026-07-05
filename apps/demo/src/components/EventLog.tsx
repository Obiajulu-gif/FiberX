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

  // Subscribe to SDK events from the active provider.
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

const KIND_COLORS: Record<string, string> = {
  connect: "green",
  disconnect: "grey",
  "invoice:created": "purple",
  "readiness:checked": "yellow",
  "payment:created": "blue",
  "payment:pending": "blue",
  "payment:succeeded": "green",
  "payment:failed": "red",
};

export function EventLog() {
  const { entries, clear } = useEventLog();
  return (
    <section className="card">
      <div className="card-head">
        <h2>Event log</h2>
        <button className="fx-btn fx-btn-small" onClick={clear}>
          Clear
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="fx-muted">
          No events yet. Connect a wallet to see SDK events stream in.
        </p>
      ) : (
        <ul className="event-log" data-testid="event-log">
          {entries.map((e) => (
            <li key={e.id} className="event-row">
              <span className="event-time">{e.at}</span>
              <span className={`event-kind event-${KIND_COLORS[e.kind] ?? "grey"}`}>
                {e.kind}
              </span>
              <span className="event-msg">{e.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
