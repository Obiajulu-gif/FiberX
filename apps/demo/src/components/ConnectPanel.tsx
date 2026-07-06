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
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="step-pill bg-fx-violet/15 text-fx-violet-400">Step 1</span>
            <h2 className="panel-title">Connect wallet</h2>
          </div>
          <p className="text-xs leading-5 text-white/45">
            Pick a provider and let the SDK request safe wallet permissions.
          </p>
        </div>
        {connected ? (
          <span className="chip bg-fx-emerald/15 text-fx-emerald">Connected</span>
        ) : (
          <span className="chip bg-fx-amber/15 text-fx-amber">Disconnected</span>
        )}
      </div>

      {!connected || !info ? (
        <div className="rounded-2xl border border-fx-violet/20 bg-fx-violet/10 px-4 py-3" data-testid="connect-hint">
          <div className="text-sm font-black text-white">Start here</div>
          <p className="mt-1 text-sm leading-6 text-white/58">
            Click <strong className="text-white/85">Connect Fiber Wallet</strong>{" "}
            in the header and choose <strong className="text-fx-violet-400">Mock Fiber Wallet</strong>.
            This lets judges test the full flow without running a Fiber node.
          </p>
        </div>
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
    <div className={`flex flex-col gap-1 rounded-xl bg-white/[0.025] px-3 py-2 ${full ? "col-span-2" : ""}`}>
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
