/**
 * Proxy configuration, loaded from environment variables.
 */

import { config as loadDotenv } from "dotenv";

loadDotenv();

export type ProxyMode = "mock" | "real";

export type ProxyConfig = {
  port: number;
  fiberRpcUrl: string;
  apiKey: string;
  mode: ProxyMode;
  corsOrigin: string;
  logLevel: string;
  network: "mainnet" | "testnet" | "devnet" | "mock";
};

export function loadConfig(
  overrides: Partial<ProxyConfig> = {},
): ProxyConfig {
  const mode = (process.env.FIBER_PROXY_MODE ?? "mock") as ProxyMode;
  return {
    port: Number(process.env.PORT ?? 3099),
    fiberRpcUrl: process.env.FIBER_RPC_URL ?? "http://127.0.0.1:8227",
    apiKey: process.env.FIBER_PROXY_API_KEY ?? "dev-secret",
    mode: mode === "real" ? "real" : "mock",
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    logLevel: process.env.LOG_LEVEL ?? "info",
    network: mode === "real" ? "testnet" : "mock",
    ...overrides,
  };
}
