/**
 * FiberReadinessBadge — compact visual for a PaymentReadinessResult.
 */

import type { PaymentReadinessResult } from "@fiberx/core";

export type FiberReadinessBadgeProps = {
  readiness?: PaymentReadinessResult;
  showAction?: boolean;
};

export function FiberReadinessBadge({
  readiness,
  showAction = true,
}: FiberReadinessBadgeProps): JSX.Element {
  if (!readiness) {
    return (
      <span className="fx-badge fx-badge-yellow" role="status">
        <span className="fx-dot fx-dot-yellow" /> Check needed
      </span>
    );
  }

  if (readiness.ok) {
    return (
      <span className="fx-badge fx-badge-green" role="status">
        <span className="fx-dot fx-dot-green" /> Ready
      </span>
    );
  }

  return (
    <span className="fx-badge fx-badge-red fx-badge-block" role="status">
      <span className="fx-badge-line">
        <span className="fx-dot fx-dot-red" /> {readiness.code}
      </span>
      {showAction && readiness.recommendedAction && (
        <span className="fx-badge-action">{readiness.recommendedAction}</span>
      )}
    </span>
  );
}
