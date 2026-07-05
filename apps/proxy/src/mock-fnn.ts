/**
 * Mock Fiber Network Node for the proxy.
 *
 * The full in-memory node lives in `@fiberx/core` as `MockFiberProvider`, so
 * the proxy and the browser SDK share exactly the same mock semantics. This
 * factory simply wires it up (with instant timers so REST calls are snappy).
 */

import { MockFiberProvider, type FiberProvider } from "@fiberx/core";

export function createMockFnnProvider(): FiberProvider {
  return new MockFiberProvider({
    appName: "FiberX Proxy (mock)",
    enableDelayMs: 0,
    // Payments settle quickly; the proxy polls via GET /api/payments/:hash.
    settleDelayMs: 800,
  });
}
