/**
 * FiberConnectButton — opens the connect modal, reflects connection state.
 */

import { useState } from "react";
import { useFiberConnect } from "../hooks.js";
import { FiberConnectModal } from "./FiberConnectModal.js";

export type FiberConnectButtonProps = {
  className?: string;
  connectLabel?: string;
};

export function FiberConnectButton({
  className,
  connectLabel = "Connect Fiber Wallet",
}: FiberConnectButtonProps): JSX.Element {
  const { connected, grant } = useFiberConnect();
  const [open, setOpen] = useState(false);

  const label = connected
    ? `${nodeLabel(grant?.providerType)} connected`
    : connectLabel;

  return (
    <>
      <button
        className={`fx-btn ${connected ? "fx-btn-success" : "fx-btn-primary"} ${
          className ?? ""
        }`}
        onClick={() => setOpen(true)}
      >
        {connected && <span className="fx-dot fx-dot-white" />}
        {label}
      </button>
      <FiberConnectModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function nodeLabel(providerType?: string): string {
  switch (providerType) {
    case "mock":
      return "Demo Fiber Wallet";
    case "proxy":
      return "Fiber Proxy Wallet";
    case "rpc":
      return "Fiber Node";
    case "injected":
      return "Fiber Wallet";
    default:
      return "Fiber Wallet";
  }
}
