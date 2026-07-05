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
    <section className="card">
      <div className="card-head">
        <h2>Connection</h2>
        {connected ? (
          <span className="fx-badge fx-badge-green">Connected</span>
        ) : (
          <span className="fx-badge fx-badge-yellow">Disconnected</span>
        )}
      </div>

      {!connected || !info ? (
        <p className="fx-muted" data-testid="connect-hint">
          Click <strong>Connect Fiber Wallet</strong> above and choose the Mock
          Fiber Wallet to explore the SDK without a node.
        </p>
      ) : (
        <div className="info-grid" data-testid="node-info">
          <Field label="Provider" value={grant?.providerType ?? "—"} />
          <Field label="Node name" value={info.nodeName ?? "—"} />
          <Field label="Network" value={info.network} />
          <Field label="Pubkey" value={shorten(info.pubkey)} mono />
          <Field label="Channels" value={String(info.channelCount)} />
          <Field label="Peers" value={String(info.peersCount)} />
          <Field
            label="Features"
            value={info.features.join(", ")}
            full
          />
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
    <div className={`field ${full ? "field-full" : ""}`}>
      <span className="field-label">{label}</span>
      <span className={`field-value ${mono ? "mono" : ""}`}>{value}</span>
    </div>
  );
}

function shorten(pubkey: string): string {
  if (pubkey.length <= 18) return pubkey;
  return `${pubkey.slice(0, 10)}…${pubkey.slice(-6)}`;
}
