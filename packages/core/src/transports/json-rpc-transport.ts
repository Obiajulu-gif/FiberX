/**
 * JSON-RPC 2.0 transport for Fiber Network Node.
 *
 * Sends requests of the form:
 *   { "jsonrpc": "2.0", "id": 1, "method": "node_info", "params": [] }
 *
 * Handles HTTP errors, JSON-RPC error objects, network timeouts, and invalid
 * responses, surfacing everything as a {@link FiberRpcError}.
 */

import { FiberRpcError } from "../errors.js";

export type JsonRpcTransportOptions = {
  url: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** Injectable fetch, primarily for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
};

type JsonRpcSuccess<T> = {
  jsonrpc: "2.0";
  id: number | string;
  result: T;
};

type JsonRpcErrorBody = {
  jsonrpc: "2.0";
  id: number | string | null;
  error: { code: number; message: string; data?: unknown };
};

export class JsonRpcTransport {
  private id = 0;
  private readonly url: string;
  private readonly headers: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: JsonRpcTransportOptions) {
    this.url = options.url;
    this.headers = {
      "content-type": "application/json",
      accept: "application/json",
      ...options.headers,
    };
    this.timeoutMs = options.timeoutMs ?? 15_000;
    const impl = options.fetchImpl ?? globalThis.fetch;
    if (!impl) {
      throw new Error(
        "No fetch implementation available. Provide fetchImpl in JsonRpcTransportOptions.",
      );
    }
    this.fetchImpl = impl;
  }

  async request<T>(method: string, params: unknown[] = []): Promise<T> {
    const id = ++this.id;
    const body = JSON.stringify({ jsonrpc: "2.0", id, method, params });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(this.url, {
        method: "POST",
        headers: this.headers,
        body,
        signal: controller.signal,
      });
    } catch (err) {
      const aborted =
        err instanceof Error &&
        (err.name === "AbortError" || err.name === "TimeoutError");
      throw new FiberRpcError({
        message: aborted
          ? `Fiber RPC request timed out after ${this.timeoutMs}ms`
          : `Fiber RPC network error: ${errMessage(err)}`,
        rpcCode: aborted ? "TIMEOUT" : "NETWORK_ERROR",
        method,
        details: err,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      let text = "";
      try {
        text = await response.text();
      } catch {
        /* ignore */
      }
      throw new FiberRpcError({
        message: `Fiber RPC HTTP ${response.status} ${response.statusText}`,
        rpcCode: response.status,
        method,
        details: text,
      });
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (err) {
      throw new FiberRpcError({
        message: "Fiber RPC returned invalid JSON.",
        rpcCode: "INVALID_RESPONSE",
        method,
        details: err,
      });
    }

    if (!isJsonRpcResponse(payload)) {
      throw new FiberRpcError({
        message: "Fiber RPC returned a malformed JSON-RPC response.",
        rpcCode: "INVALID_RESPONSE",
        method,
        details: payload,
      });
    }

    if ("error" in payload) {
      const errBody = payload as JsonRpcErrorBody;
      throw new FiberRpcError({
        message: errBody.error?.message ?? "Fiber RPC error",
        rpcCode: errBody.error?.code ?? "RPC_ERROR",
        method,
        details: errBody.error?.data ?? errBody.error,
      });
    }

    return (payload as JsonRpcSuccess<T>).result;
  }
}

function isJsonRpcResponse(value: unknown): value is
  | JsonRpcSuccess<unknown>
  | JsonRpcErrorBody {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return v.jsonrpc === "2.0" && ("result" in v || "error" in v);
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
