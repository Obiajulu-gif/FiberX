import { useEffect, useState } from "react";
import { useFiberConnect } from "@fiberx/react";
import type { FiberNodeInfo } from "@fiberx/core";

export function ConnectPanel() {
  const { connected, provider, grant } = useFiberConnect();
  const [info, setInfo] = useState<FiberNodeInfo | undefined>();

  useEffect(() => {
    let active = true;
    if (connected && provider) {
      provider
        .getInfo()
        .then((i) => active && setInfo(i))
        .catch(() => active && setInfo(undefined));
    } else {
      setInfo(undefined);
    }
    return () => {
      active = false;
    };
  }, [connected, provider]);

  return (
    <section className="panel">
      <div className="flex items-center justify-between">
        <h2 className="panel-title">Connection</h2>
        {connected ? (
          <span className="chip bg-fx-emerald/15 text-fx-emerald">Connected</span>
        ) : (
          <span className="chip bg-fx-amber/15 text-fx-amber">Disconnected</span>
        )}
      </div>

      {!connected || !info ? (
        <p className="text-sm text-white/50" data-testid="connect-hint">
          Click <strong className="text-white/80">Connect Fiber Wallet</strong>{" "}
          above and choose the Mock Fiber Wallet to explore the SDK without a
          node.
        </p>
      ) : (
        <div
          className="grid grid-cols-2 gap-x-4 gap-y-3.5"
          data-testid="node-info"
        >
          <Field label="Provider" value={grant?.providerType ?? "—"} />
          <Field label="Node name" value={info.nodeName ?? "—"} />
          <Field label="Network" value={info.network} />
          <Field label="Pubkey" value={shorten(info.pubkey)} mono />
          <Field label="Channels" value={String(info.channelCount)} />
          <Field label="Peers" value={String(info.peersCount)} />
          <Field label="Features" value={info.features.join(", ")} full />
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  mono,
  full,
}: {
  label: string;
  value: string;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
      <span className="eyebrow">{label}</span>
      <span
        className={`text-sm text-white/90 ${mono ? "font-mono text-[13px] break-all" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function shorten(pubkey: string): string {
  if (pubkey.length <= 18) return pubkey;
  return `${pubkey.slice(0, 10)}…${pubkey.slice(-6)}`;
}
