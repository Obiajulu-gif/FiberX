/**
 * @fiberx/core — public API surface.
 */

export * from "./types.js";
export * from "./errors.js";
export { FiberEventEmitter } from "./events.js";

export {
  isHexString,
  hexToDecimalString,
  hexToBigInt,
  decimalStringToHex,
  toDecimalString,
  formatUnits,
} from "./hex.js";

export {
  encodeFiberPaymentRequest,
  parseFiberPaymentRequest,
  isEncodedPaymentRequest,
  paymentRequestSchema,
  PAYMENT_REQUEST_PREFIX,
  PAYMENT_REQUEST_VERSION,
} from "./payment-request.js";

export {
  checkPaymentReadiness,
  readyOutboundCapacity,
  estimateFee,
  READINESS_MESSAGES,
  RECOMMENDED_ACTIONS,
  type ReadinessInput,
} from "./readiness.js";

export { MockFiberProvider, type MockProviderOptions } from "./mock-provider.js";

export {
  JsonRpcTransport,
  type JsonRpcTransportOptions,
} from "./transports/json-rpc-transport.js";

export {
  ProxyTransport,
  ProxyFiberProvider,
  type ProxyTransportOptions,
  type ProxyProviderOptions,
} from "./transports/proxy-transport.js";

export {
  FiberRpcProvider,
  FIBER_RPC_METHODS,
  type FiberRpcProviderOptions,
} from "./adapters/fiber-rpc-provider.js";

export {
  createMockFiberProvider,
  createProxyFiberProvider,
  createFiberProvider,
  requestProvider,
  initFiberConnect,
  FiberConnectClient,
  type CreateMockProviderConfig,
  type CreateProxyProviderConfig,
  type CreateRpcProviderConfig,
  type FiberConnectConfig,
} from "./provider.js";
