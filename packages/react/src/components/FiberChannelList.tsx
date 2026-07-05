/**
 * FiberChannelList — table of channels with state, peer, asset, balances.
 */

import { formatUnits, type FiberChannel } from "@fiberx/core";

export type FiberChannelListProps = {
  channels: FiberChannel[];
  loading?: boolean;
};

function shortPubkey(pubkey: string): string {
  if (pubkey.length <= 16) return pubkey;
  return `${pubkey.slice(0, 8)}…${pubkey.slice(-6)}`;
}

export function FiberChannelList({
  channels,
  loading,
}: FiberChannelListProps): JSX.Element {
  if (loading) {
    return <div className="fx-muted">Loading channels…</div>;
  }
  if (channels.length === 0) {
    return <div className="fx-muted">No channels.</div>;
  }

  return (
    <div className="fx-table-wrap">
      <table className="fx-table">
        <thead>
          <tr>
            <th>State</th>
            <th>Peer</th>
            <th>Asset</th>
            <th className="fx-num">Local (outbound)</th>
            <th className="fx-num">Remote (inbound)</th>
            <th>Ready</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((c) => (
            <tr key={c.channelId}>
              <td>{c.stateName}</td>
              <td>
                <code>{shortPubkey(c.peerPubkey)}</code>
              </td>
              <td>{c.currency.code}</td>
              <td className="fx-num">
                {formatUnits(c.localBalance, c.currency.decimals ?? 0)}
              </td>
              <td className="fx-num">
                {formatUnits(c.remoteBalance, c.currency.decimals ?? 0)}
              </td>
              <td>
                {c.isReady ? (
                  <span className="fx-badge fx-badge-green">Ready</span>
                ) : (
                  <span className="fx-badge fx-badge-yellow">Pending</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
