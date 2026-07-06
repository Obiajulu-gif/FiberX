import React from "react";
import ReactDOM from "react-dom/client";
import { FiberConnectProvider } from "@fiberx/react";
import "@fiberx/react/styles.css";
import "./index.css";
import { App } from "./App.js";

// Only offer the Proxy Wallet when a proxy is actually reachable:
// - local dev (`pnpm dev`) → default to the local proxy on :3099
// - hosted build (e.g. Vercel) → only if VITE_PROXY_URL is explicitly set
const proxyUrl =
  import.meta.env.VITE_PROXY_URL ??
  (import.meta.env.DEV ? "http://localhost:3099" : undefined);
const proxyApiKey = import.meta.env.VITE_PROXY_API_KEY ?? "dev-secret";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FiberConnectProvider
      appName="FiberX Demo"
      network="testnet"
      defaultProvider="mock"
      proxyUrl={proxyUrl}
      proxyApiKey={proxyApiKey}
    >
      <App />
    </FiberConnectProvider>
  </React.StrictMode>,
);
