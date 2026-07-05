/**
 * React hooks for FiberX.
 */

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  FiberConnectContext,
  type FiberConnectContextValue,
} from "./FiberConnectProvider.js";
import type {
  CanPayParams,
  FiberChannel,
  FiberProvider,
  MakeInvoiceParams,
  MakeInvoiceResult,
  ParseInvoiceResult,
  PaymentReadinessResult,
  SendPaymentParams,
  GetPaymentResult,
} from "@fiberx/core";

export function useFiberConnect(): FiberConnectContextValue {
  const ctx = useContext(FiberConnectContext);
  if (!ctx) {
    throw new Error(
      "useFiberConnect must be used inside a <FiberConnectProvider>.",
    );
  }
  return ctx;
}

export function useFiberProvider(): FiberProvider | undefined {
  return useFiberConnect().provider;
}

/** Load and cache the connected node's channels. */
export function useFiberChannels(): {
  channels: FiberChannel[];
  loading: boolean;
  error: Error | undefined;
  refresh: () => Promise<void>;
} {
  const { provider, connected } = useFiberConnect();
  const [channels, setChannels] = useState<FiberChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const refresh = useCallback(async () => {
    if (!provider) return;
    setLoading(true);
    setError(undefined);
    try {
      setChannels(await provider.listChannels());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    if (connected) void refresh();
  }, [connected, refresh]);

  return { channels, loading, error, refresh };
}

export function useFiberInvoice(): {
  invoice: MakeInvoiceResult | undefined;
  creating: boolean;
  error: Error | undefined;
  create: (params: MakeInvoiceParams) => Promise<MakeInvoiceResult>;
  parse: (invoice: string) => Promise<ParseInvoiceResult>;
  reset: () => void;
} {
  const { provider } = useFiberConnect();
  const [invoice, setInvoice] = useState<MakeInvoiceResult | undefined>();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const create = useCallback(
    async (params: MakeInvoiceParams) => {
      if (!provider) throw new Error("No Fiber provider connected.");
      setCreating(true);
      setError(undefined);
      try {
        const result = await provider.makeInvoice(params);
        setInvoice(result);
        return result;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setCreating(false);
      }
    },
    [provider],
  );

  const parse = useCallback(
    async (inv: string) => {
      if (!provider) throw new Error("No Fiber provider connected.");
      return provider.parseInvoice(inv);
    },
    [provider],
  );

  const reset = useCallback(() => setInvoice(undefined), []);

  return { invoice, creating, error, create, parse, reset };
}

export function useFiberReadiness(): {
  readiness: PaymentReadinessResult | undefined;
  checking: boolean;
  check: (params: CanPayParams) => Promise<PaymentReadinessResult>;
  reset: () => void;
} {
  const { provider } = useFiberConnect();
  const [readiness, setReadiness] = useState<
    PaymentReadinessResult | undefined
  >();
  const [checking, setChecking] = useState(false);

  const check = useCallback(
    async (params: CanPayParams) => {
      if (!provider) throw new Error("No Fiber provider connected.");
      setChecking(true);
      try {
        const result = await provider.canPay(params);
        setReadiness(result);
        return result;
      } finally {
        setChecking(false);
      }
    },
    [provider],
  );

  const reset = useCallback(() => setReadiness(undefined), []);

  return { readiness, checking, check, reset };
}

export type PaymentPhase =
  | "idle"
  | "checking"
  | "ready"
  | "pending"
  | "succeeded"
  | "failed";

/**
 * Drive a full pay flow: canPay -> sendPayment -> poll getPayment.
 */
export function useFiberPayment(): {
  phase: PaymentPhase;
  readiness: PaymentReadinessResult | undefined;
  payment: GetPaymentResult | undefined;
  error: Error | undefined;
  pay: (params: SendPaymentParams) => Promise<GetPaymentResult | undefined>;
  reset: () => void;
} {
  const { provider } = useFiberConnect();
  const [phase, setPhase] = useState<PaymentPhase>("idle");
  const [readiness, setReadiness] = useState<
    PaymentReadinessResult | undefined
  >();
  const [payment, setPayment] = useState<GetPaymentResult | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const cancelled = useRef(false);

  const reset = useCallback(() => {
    setPhase("idle");
    setReadiness(undefined);
    setPayment(undefined);
    setError(undefined);
  }, []);

  const pay = useCallback(
    async (params: SendPaymentParams) => {
      if (!provider) throw new Error("No Fiber provider connected.");
      cancelled.current = false;
      setError(undefined);
      setPayment(undefined);
      setPhase("checking");

      const check = await provider.canPay({
        invoice: params.invoice,
        maxFeeAmount: params.maxFeeAmount,
      });
      setReadiness(check);
      if (!check.ok) {
        setPhase("failed");
        return {
          paymentHash: "",
          status: "Failed" as const,
          failedError: `${check.code}: ${check.message}`,
          raw: check,
        };
      }

      setPhase("ready");
      const sent = await provider.sendPayment(params);
      if (sent.status === "Failed") {
        setPhase("failed");
        setPayment({ ...sent });
        return { ...sent };
      }

      setPhase("pending");
      // Poll until settled or timeout (~15s).
      const timeoutMs = (params.timeoutSeconds ?? 30) * 1000;
      const start = Date.now();
      let latest: GetPaymentResult = { ...sent };
      while (!cancelled.current && Date.now() - start < timeoutMs) {
        await delay(400);
        latest = await provider.getPayment(sent.paymentHash);
        setPayment(latest);
        if (latest.status === "Succeeded") {
          setPhase("succeeded");
          return latest;
        }
        if (latest.status === "Failed") {
          setPhase("failed");
          return latest;
        }
      }
      if (latest.status !== "Succeeded" && latest.status !== "Failed") {
        setError(new Error("Payment timed out before settling."));
        setPhase("failed");
      }
      return latest;
    },
    [provider],
  );

  useEffect(() => {
    return () => {
      cancelled.current = true;
    };
  }, []);

  return { phase, readiness, payment, error, pay, reset };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
