import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { FiberConnectProvider } from "../src/FiberConnectProvider.js";
import {
  useFiberConnect,
  useFiberInvoice,
  useFiberReadiness,
} from "../src/hooks.js";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <FiberConnectProvider
      appName="Test App"
      network="mock"
      defaultProvider="mock"
      mock={{ enableDelayMs: 0, settleDelayMs: 10 }}
    >
      {children}
    </FiberConnectProvider>
  );
}

describe("useFiberConnect", () => {
  it("connects and exposes provider + grant", async () => {
    const { result } = renderHook(() => useFiberConnect(), { wrapper });
    expect(result.current.connected).toBe(false);
    await act(async () => {
      await result.current.connect("mock");
    });
    await waitFor(() => expect(result.current.connected).toBe(true));
    expect(result.current.provider).toBeDefined();
    expect(result.current.grant?.providerType).toBe("mock");
  });
});

describe("useFiberInvoice + useFiberReadiness", () => {
  it("creates an invoice and checks readiness", async () => {
    const { result } = renderHook(
      () => ({
        conn: useFiberConnect(),
        invoice: useFiberInvoice(),
        readiness: useFiberReadiness(),
      }),
      { wrapper },
    );

    await act(async () => {
      await result.current.conn.connect("mock");
    });

    let invoiceAddress = "";
    await act(async () => {
      const inv = await result.current.invoice.create({
        amount: "100000000",
        currency: { code: "CKB", decimals: 8 },
        description: "Hook test",
      });
      invoiceAddress = inv.invoiceAddress;
    });
    expect(invoiceAddress.startsWith("fibt_mock_")).toBe(true);

    await act(async () => {
      await result.current.readiness.check({ invoice: invoiceAddress });
    });
    expect(result.current.readiness.readiness?.ok).toBe(true);
    expect(result.current.readiness.readiness?.code).toBe("READY");
  });
});
