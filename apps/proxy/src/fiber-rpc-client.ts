/**
 * FiberService — the provider the proxy routes call into.
 *
 * In "mock" mode it is a shared in-memory MockFiberProvider.
 * In "real" mode it is a FiberRpcProvider pointed at FIBER_RPC_URL.
 *
 * The provider is enabled lazily on first use so the server can boot even if a
 * real node is temporarily unreachable (routes then return a clear error).
 */

import {
  createFiberProvider,
  FiberConnectError,
  type FiberProvider,
} from "@fiberx/core";
import type { ProxyConfig } from "./config.js";
import { createMockFnnProvider } from "./mock-fnn.js";

export class FiberService {
  private provider: FiberProvider;
  private enabled = false;

  constructor(private readonly config: ProxyConfig) {
    this.provider =
      config.mode === "real"
        ? createFiberProvider({
            appName: "FiberX Proxy",
            rpcUrl: config.fiberRpcUrl,
            network: config.network === "mock" ? "testnet" : config.network,
          })
        : createMockFnnProvider();
  }

  get mode() {
    return this.config.mode;
  }

  /** Ensure the underlying provider has been enabled at least once. */
  async ready(): Promise<FiberProvider> {
    if (!this.enabled) {
      try {
        await this.provider.enable();
        this.enabled = true;
      } catch (err) {
        throw new FiberConnectError(
          this.config.mode === "real"
            ? `Could not reach the Fiber node at ${this.config.fiberRpcUrl}. Check FIBER_RPC_URL and that the node is running.`
            : "Failed to initialise the mock Fiber node.",
          "FIBER_CONNECT_ERROR",
          err,
        );
      }
    }
    return this.provider;
  }
}
