import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FiberConnectProvider } from "../src/FiberConnectProvider.js";
import { FiberConnectButton } from "../src/components/FiberConnectButton.js";
import { FiberReadinessBadge } from "../src/components/FiberReadinessBadge.js";
import type { PaymentReadinessResult } from "@fiberx/core";

function wrap(ui: React.ReactNode) {
  return (
    <FiberConnectProvider
      appName="Test App"
      network="mock"
      defaultProvider="mock"
      mock={{ enableDelayMs: 0, settleDelayMs: 10 }}
    >
      {ui}
    </FiberConnectProvider>
  );
}

describe("FiberConnectButton", () => {
  it("renders the disconnected label", () => {
    render(wrap(<FiberConnectButton />));
    expect(
      screen.getByRole("button", { name: /connect fiber wallet/i }),
    ).toBeInTheDocument();
  });

  it("opens the connect modal on click", async () => {
    const user = userEvent.setup();
    render(wrap(<FiberConnectButton />));
    await user.click(
      screen.getByRole("button", { name: /connect fiber wallet/i }),
    );
    expect(
      screen.getByRole("dialog", { name: /connect fiber wallet/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Mock Fiber Wallet/i)).toBeInTheDocument();
  });

  it("connects to the mock wallet", async () => {
    const user = userEvent.setup();
    render(wrap(<FiberConnectButton />));
    await user.click(
      screen.getByRole("button", { name: /connect fiber wallet/i }),
    );
    // Click the modal's Connect action.
    await user.click(screen.getByRole("button", { name: /^connect$/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /connected/i }),
      ).toBeInTheDocument(),
    );
  });
});

describe("FiberReadinessBadge", () => {
  it("shows 'Check needed' when no readiness given", () => {
    render(<FiberReadinessBadge />);
    expect(screen.getByText(/check needed/i)).toBeInTheDocument();
  });

  it("shows Ready for a payable result", () => {
    const readiness: PaymentReadinessResult = {
      ok: true,
      code: "READY",
      message: "Payment appears payable.",
    };
    render(<FiberReadinessBadge readiness={readiness} />);
    expect(screen.getByText(/^ready$/i)).toBeInTheDocument();
  });

  it("shows the failure code and recommended action", () => {
    const readiness: PaymentReadinessResult = {
      ok: false,
      code: "INSUFFICIENT_OUTBOUND_CAPACITY",
      message: "Not enough ready outbound capacity for this payment.",
      recommendedAction: "Try a smaller amount, add liquidity, or use another asset.",
    };
    render(<FiberReadinessBadge readiness={readiness} />);
    expect(
      screen.getByText(/INSUFFICIENT_OUTBOUND_CAPACITY/),
    ).toBeInTheDocument();
    expect(screen.getByText(/smaller amount/i)).toBeInTheDocument();
  });
});
