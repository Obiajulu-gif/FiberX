import { useFiberChannels, FiberChannelList } from "@fiberx/react";
import { formatUnits } from "@fiberx/core";

export function ChannelPanel() {
  const { channels, loading } = useFiberChannels();

  const ready = channels.filter((c) => c.isReady);
  const pending = channels.filter((c) => !c.isReady);

  const outbound = (code: string) =>
    ready
      .filter((c) => c.currency.code === code)
      .reduce((acc, c) => acc + BigInt(c.localBalance), 0n)
      .toString();

  const ckbDecimals =
    channels.find((c) => c.currency.code === "CKB")?.currency.decimals ?? 8;
  const rusdDecimals =
    channels.find((c) => c.currency.code === "RUSD")?.currency.decimals ?? 6;

  return (
    <section className="panel">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="step-pill bg-fx-cyan/15 text-fx-cyan">Capacity</span>
          <h2 className="panel-title">Wallet channel snapshot</h2>
        </div>
        <p className="text-xs leading-5 text-white/45">
          Readiness checks use this ready outbound capacity before a payment is sent.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Stat label="Ready channels" value={String(ready.length)} accent="emerald" />
        <Stat label="Pending" value={String(pending.length)} accent="amber" />
        <Stat
          label="Outbound CKB"
          value={formatUnits(outbound("CKB"), ckbDecimals)}
          accent="violet"
        />
        <Stat
          label="Outbound RUSD"
          value={formatUnits(outbound("RUSD"), rusdDecimals)}
          accent="cyan"
        />
      </div>

      <FiberChannelList channels={channels} loading={loading} />
    </section>
  );
}

const ACCENTS: Record<string, string> = {
  emerald: "from-fx-emerald/20 to-fx-emerald/5 text-fx-emerald",
  amber: "from-fx-amber/20 to-fx-amber/5 text-fx-amber",
  violet: "from-fx-violet/25 to-fx-violet/5 text-fx-violet-400",
  cyan: "from-fx-cyan/20 to-fx-cyan/5 text-fx-cyan",
};

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-gradient-to-br p-3 ${ACCENTS[accent]}`}
    >
      <div className="text-xl font-black leading-tight">{value}</div>
      <div className="mt-0.5 text-[11px] font-semibold text-white/50">
        {label}
      </div>
    </div>
  );
}
