import { describe, it, expect, vi } from "vitest";
import { JsonRpcTransport } from "../src/transports/json-rpc-transport.js";
import { FiberRpcError } from "../src/errors.js";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("JsonRpcTransport", () => {
  it("sends a correct JSON-RPC 2.0 request and returns the result", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.jsonrpc).toBe("2.0");
      expect(body.method).toBe("node_info");
      expect(Array.isArray(body.params)).toBe(true);
      expect(typeof body.id).toBe("number");
      return jsonResponse({ jsonrpc: "2.0", id: body.id, result: { ok: true } });
    }) as unknown as typeof fetch;

    const transport = new JsonRpcTransport({
      url: "http://node.test",
      fetchImpl,
    });
    const result = await transport.request<{ ok: boolean }>("node_info", []);
    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("throws FiberRpcError on a JSON-RPC error object", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        jsonrpc: "2.0",
        id: 1,
        error: { code: -32601, message: "Method not found" },
      }),
    ) as unknown as typeof fetch;

    const transport = new JsonRpcTransport({ url: "http://n", fetchImpl });
    await expect(transport.request("bogus")).rejects.toMatchObject({
      name: "FiberRpcError",
      rpcCode: -32601,
      method: "bogus",
    });
  });

  it("throws FiberRpcError on HTTP error status", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("nope", { status: 500, statusText: "Server Error" }),
    ) as unknown as typeof fetch;
    const transport = new JsonRpcTransport({ url: "http://n", fetchImpl });
    await expect(transport.request("node_info")).rejects.toBeInstanceOf(
      FiberRpcError,
    );
  });

  it("throws FiberRpcError on invalid (non JSON-RPC) response", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ not: "jsonrpc" }),
    ) as unknown as typeof fetch;
    const transport = new JsonRpcTransport({ url: "http://n", fetchImpl });
    await expect(transport.request("node_info")).rejects.toMatchObject({
      rpcCode: "INVALID_RESPONSE",
    });
  });

  it("throws FiberRpcError on timeout / abort", async () => {
    const fetchImpl = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        return await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      },
    ) as unknown as typeof fetch;

    const transport = new JsonRpcTransport({
      url: "http://n",
      fetchImpl,
      timeoutMs: 10,
    });
    await expect(transport.request("node_info")).rejects.toMatchObject({
      rpcCode: "TIMEOUT",
    });
  });
});
