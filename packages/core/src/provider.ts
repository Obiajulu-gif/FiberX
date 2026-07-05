/**
 * Provider factory + FiberConnectClient.
 *
 * This module ties the pieces together and exposes the top-level developer
 * entry points:
 *   - createMockFiberProvider()  — fully in-memory, no node required
 *   - createProxyFiberProvider() — talks to the FiberX proxy over REST
 *   - createFiberProvider()      — talks to a raw Fiber node over JSON-RPC
 *   - requestProvider()          — WebLN-style discovery of an injected wallet
 *   - initFiberConnect()         — returns a FiberConnectClient
 */

import { FiberProviderNotFoundError } from "./errors.js";
import { MockFiberProvider, type MockProviderOptions } from "./mock-provider.js";
import { ProxyTransport } from "./transports/proxy-transport.js";
import { ProxyFiberProvider } from "./transports/proxy-transport.js";
import { JsonRpcTransport } from "./transports/json-rpc-transport.js";
import { FiberRpcProvider } from "./adapters/fiber-rpc-provider.js";
import type {
  FiberNetwork,
  FiberPermissionGrant,
  FiberProvider,
  FiberProviderType,
} from "./types.js";

export type CreateMockProviderConfig = MockProviderOptions & {
  appName?: string;
};

export function createMockFiberProvider(
  config: CreateMockProviderConfig = {},
): FiberProvider {
  return new MockFiberProvider(config);
}

export type CreateProxyProviderConfig = {
  appName?: string;
  proxyUrl: string;
  proxyApiKey?: string;
  network?: FiberNetwork;
  timeoutMs?: number;
};

export function createProxyFiberProvider(
  config: CreateProxyProviderConfig,
): FiberProvider {
  const transport = new ProxyTransport({
    baseUrl: config.proxyUrl,
    apiKey: config.proxyApiKey,
    timeoutMs: config.timeoutMs,
  });
  return new ProxyFiberProvider(transport, {
    appName: config.appName ?? "FiberX App",
    network: config.network ?? "testnet",
  });
}

export type CreateRpcProviderConfig = {
  appName?: string;
  rpcUrl: string;
  headers?: Record<string, string>;
  network?: FiberNetwork;
  timeoutMs?: number;
};

/**
 * Create a provider that talks directly to a Fiber node's JSON-RPC endpoint.
 *
 * WARNING: Do not use this from the browser with a real node URL. Browsers
 * should go through `createProxyFiberProvider`. This factory exists for
 * server-side use and for the proxy itself.
 */
export function createFiberProvider(
  config: CreateRpcProviderConfig,
): FiberProvider {
  const transport = new JsonRpcTransport({
    url: config.rpcUrl,
    headers: config.headers,
    timeoutMs: config.timeoutMs,
  });
  return new FiberRpcProvider(transport, {
    appName: config.appName ?? "FiberX App",
    network: config.network ?? "testnet",
  });
}

/**
 * WebLN-style provider discovery. Looks for an injected `window.fiber`
 * provider. Throws {@link FiberProviderNotFoundError} when none is present.
 */
export async function requestProvider(): Promise<FiberProvider> {
  const injected = getInjectedProvider();
  if (!injected) {
    throw new FiberProviderNotFoundError(
      "No injected window.fiber provider found. Use a mock or proxy provider instead.",
    );
  }
  await injected.enable();
  return injected;
}

function getInjectedProvider(): FiberProvider | undefined {
  if (typeof globalThis === "undefined") return undefined;
  const w = globalThis as unknown as { fiber?: FiberProvider };
  return w.fiber;
}

export type FiberConnectConfig = {
  appName: string;
  network?: FiberNetwork;
  defaultProvider?: FiberProviderType;
  proxyUrl?: string;
  proxyApiKey?: string;
  rpcUrl?: string;
  mock?: MockProviderOptions;
};

/**
 * High-level client that manages provider selection and connection state.
 * The React package wraps this, but it is usable standalone in any JS app.
 */
export class FiberConnectClient {
  private provider: FiberProvider | undefined;
  private grant: FiberPermissionGrant | undefined;

  constructor(private readonly config: FiberConnectConfig) {}

  getProvider(): FiberProvider | undefined {
    return this.provider;
  }

  getGrant(): FiberPermissionGrant | undefined {
    return this.grant;
  }

  isConnected(): boolean {
    return this.provider?.isConnected() ?? false;
  }

  /** Build (but do not enable) a provider of the given type. */
  createProvider(type: FiberProviderType): FiberProvider {
    switch (type) {
      case "mock":
        return createMockFiberProvider({
          appName: this.config.appName,
          ...this.config.mock,
        });
      case "proxy":
        if (!this.config.proxyUrl) {
          throw new FiberProviderNotFoundError(
            "proxyUrl is required to create a proxy provider.",
          );
        }
        return createProxyFiberProvider({
          appName: this.config.appName,
          proxyUrl: this.config.proxyUrl,
          proxyApiKey: this.config.proxyApiKey,
          network: this.config.network,
        });
      case "rpc":
        if (!this.config.rpcUrl) {
          throw new FiberProviderNotFoundError(
            "rpcUrl is required to create an rpc provider.",
          );
        }
        return createFiberProvider({
          appName: this.config.appName,
          rpcUrl: this.config.rpcUrl,
          network: this.config.network,
        });
      case "injected": {
        const injected = getInjectedProvider();
        if (!injected) {
          throw new FiberProviderNotFoundError(
            "No injected window.fiber provider found.",
          );
        }
        return injected;
      }
      default:
        throw new FiberProviderNotFoundError(
          `Unknown provider type: ${String(type)}`,
        );
    }
  }

  /** Create + enable a provider of the given type and track it as active. */
  async connect(
    type: FiberProviderType = this.config.defaultProvider ?? "mock",
  ): Promise<FiberPermissionGrant> {
    const provider = this.createProvider(type);
    const grant = await provider.enable();
    this.provider = provider;
    this.grant = grant;
    return grant;
  }

  async disconnect(): Promise<void> {
    await this.provider?.disconnect();
    this.provider = undefined;
    this.grant = undefined;
  }
}

export function initFiberConnect(
  config: FiberConnectConfig,
): FiberConnectClient {
  return new FiberConnectClient(config);
}
