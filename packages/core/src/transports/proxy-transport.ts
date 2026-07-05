/**
 * Proxy transport + ProxyFiberProvider.
 *
 * Talks to the FiberX proxy's REST API (see apps/proxy). This is the
 * recommended way to reach a real Fiber node from the browser: the node's
 * JSON-RPC URL and API key never leave the server.
 */

import { FiberEventEmitter } from "../events.js";
import { FiberConnectError } from "../errors.js";
import type {
  CanPayParams,
  FiberBalance,
  FiberChannel,
  FiberEventListener,
  FiberEventName,
  FiberNetwork,
  FiberNodeInfo,
  FiberPermissionGrant,
  FiberProvider,
  FiberProviderMeta,
  GetBalanceParams,
  GetInvoiceResult,
  GetPaymentResult,
  ListChannelsParams,
  MakeInvoiceParams,
  MakeInvoiceResult,
  ParseInvoiceResult,
  PaymentReadinessResult,
  SendPaymentParams,
  SendPaymentResult,
} from "../types.js";

export type ProxyTransportOptions = {
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export class ProxyTransport {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ProxyTransportOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 15_000;
    const impl = options.fetchImpl ?? globalThis.fetch;
    if (!impl) {
      throw new Error("No fetch implementation available for ProxyTransport.");
    }
    this.fetchImpl = impl;
  }

  async get<T>(path: string): Promise<T> {
    return this.call<T>("GET", path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.call<T>("POST", path, body);
  }

  private async call<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers: Record<string, string> = {
      accept: "application/json",
    };
    if (this.apiKey) headers["x-fiber-connect-key"] = this.apiKey;
    if (body !== undefined) headers["content-type"] = "application/json";

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      throw new FiberConnectError(
        aborted
          ? `Proxy request timed out after ${this.timeoutMs}ms`
          : `Proxy network error: ${err instanceof Error ? err.message : String(err)}`,
        "FIBER_CONNECT_ERROR",
        err,
      );
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let payload: unknown = undefined;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      const message =
        (isRecord(payload) && typeof payload.message === "string"
          ? payload.message
          : undefined) ?? `Proxy HTTP ${response.status}`;
      throw new FiberConnectError(message, "FIBER_CONNECT_ERROR", payload);
    }

    return payload as T;
  }
}

export type ProxyProviderOptions = {
  appName: string;
  network: FiberNetwork;
};

export class ProxyFiberProvider implements FiberProvider {
  readonly meta: FiberProviderMeta;
  private readonly emitter = new FiberEventEmitter();
  private connected = false;

  constructor(
    private readonly transport: ProxyTransport,
    private readonly options: ProxyProviderOptions,
  ) {
    this.meta = {
      type: "proxy",
      label: "Fiber Proxy Wallet",
      network: options.network,
    };
  }

  on<EventName extends FiberEventName>(
    event: EventName,
    listener: FiberEventListener<EventName>,
  ): () => void {
    return this.emitter.on(event, listener);
  }

  isConnected(): boolean {
    return this.connected;
  }

  async enable(): Promise<FiberPermissionGrant> {
    // A successful health + node-info round trip is our "connect".
    await this.transport.get<{ ok: boolean }>("/health");
    await this.getInfo();
    this.connected = true;
    const grant: FiberPermissionGrant = {
      appName: this.options.appName,
      network: this.options.network,
      scopes: ["info", "channels", "invoices", "readiness", "payments"],
      grantedAt: new Date().toISOString(),
      providerType: "proxy",
    };
    this.emitter.emit("connect", grant);
    return grant;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.emitter.emit("disconnect", { providerType: "proxy" });
  }

  async getInfo(): Promise<FiberNodeInfo> {
    return this.transport.get<FiberNodeInfo>("/api/node-info");
  }

  async listChannels(params?: ListChannelsParams): Promise<FiberChannel[]> {
    const query = params?.peerPubkey
      ? `?peerPubkey=${encodeURIComponent(params.peerPubkey)}`
      : "";
    const res = await this.transport.get<{ channels: FiberChannel[] }>(
      `/api/channels${query}`,
    );
    return res.channels;
  }

  async getBalance(_params?: GetBalanceParams): Promise<FiberBalance> {
    return this.transport.get<FiberBalance>("/api/balance");
  }

  async makeInvoice(params: MakeInvoiceParams): Promise<MakeInvoiceResult> {
    const result = await this.transport.post<MakeInvoiceResult>(
      "/api/invoices",
      params,
    );
    this.emitter.emit("invoice:created", result);
    return result;
  }

  async parseInvoice(invoice: string): Promise<ParseInvoiceResult> {
    return this.transport.post<ParseInvoiceResult>("/api/invoices/parse", {
      invoice,
    });
  }

  async getInvoice(paymentHash: string): Promise<GetInvoiceResult> {
    return this.transport.get<GetInvoiceResult>(
      `/api/invoices/${encodeURIComponent(paymentHash)}`,
    );
  }

  async canPay(params: CanPayParams): Promise<PaymentReadinessResult> {
    const result = await this.transport.post<PaymentReadinessResult>(
      "/api/can-pay",
      params,
    );
    this.emitter.emit("readiness:checked", result);
    return result;
  }

  async sendPayment(params: SendPaymentParams): Promise<SendPaymentResult> {
    const result = await this.transport.post<SendPaymentResult>(
      "/api/payments/send",
      params,
    );
    if (result.status === "Failed") {
      this.emitter.emit("payment:failed", result);
    } else {
      this.emitter.emit("payment:created", result);
    }
    return result;
  }

  async getPayment(paymentHash: string): Promise<GetPaymentResult> {
    const result = await this.transport.get<GetPaymentResult>(
      `/api/payments/${encodeURIComponent(paymentHash)}`,
    );
    if (result.status === "Succeeded") {
      this.emitter.emit("payment:succeeded", result);
    } else if (result.status === "Failed") {
      this.emitter.emit("payment:failed", result);
    } else if (result.status === "Pending") {
      this.emitter.emit("payment:pending", result);
    }
    return result;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
