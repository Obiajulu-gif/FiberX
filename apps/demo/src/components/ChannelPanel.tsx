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
    <section className="card">
      <div className="card-head">
        <h2>Channels</h2>
      </div>

      <div className="stat-grid">
        <Stat label="Ready channels" value={String(ready.length)} tone="green" />
        <Stat
          label="Pending channels"
          value={String(pending.length)}
          tone="yellow"
        />
        <Stat
          label="Outbound CKB"
          value={`${formatUnits(outbound("CKB"), ckbDecimals)} CKB`}
          tone="purple"
        />
        <Stat
          label="Outbound RUSD"
          value={`${formatUnits(outbound("RUSD"), rusdDecimals)} RUSD`}
          tone="blue"
        />
      </div>

      <FiberChannelList channels={channels} loading={loading} />
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`stat stat-${tone}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
