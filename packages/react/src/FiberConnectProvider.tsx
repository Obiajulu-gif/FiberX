/**
 * FiberConnectProvider — React context that owns the FiberConnectClient and
 * exposes connection state to the component tree.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  FiberConnectClient,
  type FiberEventName,
  type FiberNetwork,
  type FiberPermissionGrant,
  type FiberProvider,
  type FiberProviderType,
  type MockProviderOptions,
} from "@fiberx/core";

export type FiberConnectContextValue = {
  client: FiberConnectClient;
  provider: FiberProvider | undefined;
  grant: FiberPermissionGrant | undefined;
  connected: boolean;
  connecting: boolean;
  error: Error | undefined;
  appName: string;
  network: FiberNetwork;
  availableProviders: FiberProviderType[];
  connect: (type?: FiberProviderType) => Promise<void>;
  disconnect: () => Promise<void>;
};

export const FiberConnectContext =
  createContext<FiberConnectContextValue | null>(null);

export type FiberConnectProviderProps = {
  appName: string;
  network?: FiberNetwork;
  defaultProvider?: FiberProviderType;
  proxyUrl?: string;
  proxyApiKey?: string;
  rpcUrl?: string;
  mock?: MockProviderOptions;
  children: ReactNode;
};

export function FiberConnectProvider({
  appName,
  network = "testnet",
  defaultProvider = "mock",
  proxyUrl,
  proxyApiKey,
  rpcUrl,
  mock,
  children,
}: FiberConnectProviderProps): JSX.Element {
  const client = useMemo(
    () =>
      new FiberConnectClient({
        appName,
        network,
        defaultProvider,
        proxyUrl,
        proxyApiKey,
        rpcUrl,
        mock,
      }),
    // The client is created once per config identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appName, network, defaultProvider, proxyUrl, proxyApiKey, rpcUrl],
  );

  const [provider, setProvider] = useState<FiberProvider | undefined>();
  const [grant, setGrant] = useState<FiberPermissionGrant | undefined>();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const bump = useRef(0);
  const [, forceRender] = useState(0);

  const availableProviders = useMemo<FiberProviderType[]>(() => {
    const list: FiberProviderType[] = ["mock"];
    if (proxyUrl) list.push("proxy");
    if (rpcUrl) list.push("rpc");
    if (
      typeof window !== "undefined" &&
      (window as unknown as { fiber?: unknown }).fiber
    ) {
      list.push("injected");
    }
    return list;
  }, [proxyUrl, rpcUrl]);

  const connect = useCallback(
    async (type: FiberProviderType = defaultProvider) => {
      setConnecting(true);
      setError(undefined);
      try {
        const g = await client.connect(type);
        setProvider(client.getProvider());
        setGrant(g);
        setConnected(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setConnected(false);
        throw err;
      } finally {
        setConnecting(false);
      }
    },
    [client, defaultProvider],
  );

  const disconnect = useCallback(async () => {
    await client.disconnect();
    setProvider(undefined);
    setGrant(undefined);
    setConnected(false);
  }, [client]);

  // Re-render on relevant provider events so consumers stay fresh.
  useEffect(() => {
    if (!provider) return;
    const events: FiberEventName[] = [
      "payment:created",
      "payment:pending",
      "payment:succeeded",
      "payment:failed",
      "invoice:created",
      "readiness:checked",
    ];
    const offs = events.map((e) =>
      provider.on(e, () => {
        bump.current += 1;
        forceRender((n) => n + 1);
      }),
    );
    const offDisconnect = provider.on("disconnect", () => {
      setConnected(false);
    });
    return () => {
      offs.forEach((off) => off());
      offDisconnect();
    };
  }, [provider]);

  const value: FiberConnectContextValue = {
    client,
    provider,
    grant,
    connected,
    connecting,
    error,
    appName,
    network,
    availableProviders,
    connect,
    disconnect,
  };

  return (
    <FiberConnectContext.Provider value={value}>
      {children}
    </FiberConnectContext.Provider>
  );
}
