import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DemoStateValue = {
  lastInvoice: string;
  setLastInvoice: (invoice: string) => void;
};

const DemoStateContext = createContext<DemoStateValue | null>(null);

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [lastInvoice, setLastInvoice] = useState("");
  const value = useMemo(
    () => ({ lastInvoice, setLastInvoice }),
    [lastInvoice],
  );
  return (
    <DemoStateContext.Provider value={value}>
      {children}
    </DemoStateContext.Provider>
  );
}

export function useDemoState(): DemoStateValue {
  const ctx = useContext(DemoStateContext);
  if (!ctx) throw new Error("useDemoState must be used inside DemoStateProvider");
  return ctx;
}
