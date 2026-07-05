/**
 * Error classes used across the FiberX SDK.
 *
 * All errors extend {@link FiberConnectError} so callers can catch a single
 * base type and branch on `error.code`.
 */

export type FiberErrorCode =
  | "FIBER_CONNECT_ERROR"
  | "PROVIDER_NOT_FOUND"
  | "USER_REJECTED"
  | "RPC_ERROR"
  | "READINESS_ERROR"
  | "INVALID_PAYMENT_REQUEST";

export class FiberConnectError extends Error {
  readonly code: FiberErrorCode;
  readonly details?: unknown;

  constructor(
    message: string,
    code: FiberErrorCode = "FIBER_CONNECT_ERROR",
    details?: unknown,
  ) {
    super(message);
    this.name = "FiberConnectError";
    this.code = code;
    this.details = details;
    // Preserve prototype chain when compiled to ES5-ish targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FiberProviderNotFoundError extends FiberConnectError {
  constructor(message = "No Fiber provider is available.", details?: unknown) {
    super(message, "PROVIDER_NOT_FOUND", details);
    this.name = "FiberProviderNotFoundError";
  }
}

export class FiberUserRejectedError extends FiberConnectError {
  constructor(
    message = "The user rejected the Fiber connection request.",
    details?: unknown,
  ) {
    super(message, "USER_REJECTED", details);
    this.name = "FiberUserRejectedError";
  }
}

export class FiberRpcError extends FiberConnectError {
  /** JSON-RPC or transport-level error code. */
  readonly rpcCode: number | string;
  /** RPC method that was being invoked when the error occurred. */
  readonly method: string;

  constructor(params: {
    message: string;
    rpcCode: number | string;
    method: string;
    details?: unknown;
  }) {
    super(params.message, "RPC_ERROR", params.details);
    this.name = "FiberRpcError";
    this.rpcCode = params.rpcCode;
    this.method = params.method;
  }
}

export class FiberReadinessError extends FiberConnectError {
  constructor(message: string, details?: unknown) {
    super(message, "READINESS_ERROR", details);
    this.name = "FiberReadinessError";
  }
}

export class FiberInvalidPaymentRequestError extends FiberConnectError {
  constructor(message: string, details?: unknown) {
    super(message, "INVALID_PAYMENT_REQUEST", details);
    this.name = "FiberInvalidPaymentRequestError";
  }
}
