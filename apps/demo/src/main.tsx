import React from "react";
import ReactDOM from "react-dom/client";
import { FiberConnectProvider } from "@fiberx/react";
import "@fiberx/react/styles.css";
import { App } from "./App.js";
import "./demo.css";

const proxyUrl = import.meta.env.VITE_PROXY_URL ?? "http://localhost:3099";
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
