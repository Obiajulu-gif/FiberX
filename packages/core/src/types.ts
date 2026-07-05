/**
 * Core type definitions for the FiberX SDK.
 *
 * These types describe the SDK-facing shape of Fiber Network concepts
 * (nodes, channels, invoices, payments). They are intentionally decoupled
 * from the raw Fiber JSON-RPC wire format — the mapping between the two lives
 * in `adapters/fiber-rpc-provider.ts`, which is the single compatibility layer.
 */

export type FiberNetwork = "mainnet" | "testnet" | "devnet" | "mock";

export type FiberCurrency = {
  /** Short asset code, e.g. "CKB", "RUSD", "Fibt". */
  code: string;
  displayName?: string;
  /** Number of decimals used to render a human amount from base units. */
  decimals?: number;
  /** Optional UDT type script for CKB user-defined tokens. */
  udtTypeScript?: unknown;
};

export type FiberNodeInfo = {
  version?: string;
  commitHash?: string;
  pubkey: string;
  nodeName?: string;
  addresses: string[];
  chainHash?: string;
  features: string[];
  channelCount: number;
  pendingChannelCount: number;
  peersCount: number;
  network: FiberNetwork;
};

export type FiberChannel = {
  channelId: string;
  stateName: string;
  peerPubkey: string;
  fundingAmount?: string;
  /** Outbound capacity in base units (spendable by us). */
  localBalance: string;
  /** Inbound capacity in base units (spendable by the peer). */
  remoteBalance: string;
  currency: FiberCurrency;
  public: boolean;
  isReady: boolean;
};

export type FiberBalance = {
  totalLocalBalance: string;
  totalRemoteBalance: string;
  readyLocalBalance: string;
  readyRemoteBalance: string;
  byCurrency: Array<{
    currency: FiberCurrency;
    localBalance: string;
    remoteBalance: string;
    readyLocalBalance: string;
    readyRemoteBalance: string;
  }>;
};

export type ListChannelsParams = {
  peerPubkey?: string;
  includeClosed?: boolean;
};

export type GetBalanceParams = {
  currencyCode?: string;
};

export type MakeInvoiceParams = {
  amount: string;
  currency: FiberCurrency;
  description?: string;
  expirySeconds?: number;
  paymentPreimage?: string;
  paymentHash?: string;
  hashAlgorithm?: "sha256";
  metadata?: Record<string, unknown>;
};

export type MakeInvoiceResult = {
  invoiceAddress: string;
  paymentHash: string;
  invoice: unknown;
  status?: string;
};

export type ParseInvoiceResult = {
  invoiceAddress: string;
  amount?: string;
  currency?: FiberCurrency;
  description?: string;
  paymentHash?: string;
  expiresAt?: string;
  payeePubkey?: string;
  raw: unknown;
};

export type GetInvoiceResult = ParseInvoiceResult & {
  status?: string;
};

export type CanPayParams = {
  invoice?: string;
  amount?: string;
  currency?: FiberCurrency;
  maxFeeAmount?: string;
  timeoutSeconds?: number;
};

export type PaymentReadinessCode =
  | "READY"
  | "NO_PROVIDER"
  | "NODE_OFFLINE"
  | "NO_ROUTE"
  | "INSUFFICIENT_OUTBOUND_CAPACITY"
  | "INSUFFICIENT_INBOUND_CAPACITY"
  | "ASSET_UNSUPPORTED"
  | "FEE_TOO_HIGH"
  | "INVOICE_INVALID"
  | "PAYMENT_ALREADY_PAID"
  | "UNKNOWN";

export type RouteConfidence = "high" | "medium" | "low" | "unknown";

export type PaymentReadinessResult = {
  ok: boolean;
  code: PaymentReadinessCode;
  message: string;
  recommendedAction?: string;
  estimatedFee?: string;
  routeConfidence?: RouteConfidence;
  details?: Record<string, unknown>;
};

export type SendPaymentParams = {
  invoice: string;
  maxFeeAmount?: string;
  maxFeeRate?: number;
  timeoutSeconds?: number;
  dryRun?: boolean;
};

export type PaymentStatus =
  | "Created"
  | "Pending"
  | "Succeeded"
  | "Failed"
  | "Unknown";

export type SendPaymentResult = {
  paymentHash: string;
  status: PaymentStatus;
  fee?: string;
  preimage?: string;
  failedError?: string | null;
  raw: unknown;
};

export type GetPaymentResult = SendPaymentResult & {
  createdAt?: string;
  lastUpdatedAt?: string;
};

export type FiberPermissionScope =
  | "info"
  | "channels"
  | "invoices"
  | "readiness"
  | "payments";

export type FiberPermissionGrant = {
  appName: string;
  network: FiberNetwork;
  scopes: FiberPermissionScope[];
  grantedAt: string;
  providerType: FiberProviderType;
};

export type FiberProviderType = "mock" | "proxy" | "rpc" | "injected";

export type FiberProviderMeta = {
  type: FiberProviderType;
  label: string;
  network: FiberNetwork;
};

/**
 * The main provider interface an app talks to. Inspired by WebLN's
 * request/enable model, but specific to Fiber Network semantics.
 */
export interface FiberProvider {
  readonly meta: FiberProviderMeta;

  enable(): Promise<FiberPermissionGrant>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  getInfo(): Promise<FiberNodeInfo>;
  listChannels(params?: ListChannelsParams): Promise<FiberChannel[]>;
  getBalance(params?: GetBalanceParams): Promise<FiberBalance>;

  makeInvoice(params: MakeInvoiceParams): Promise<MakeInvoiceResult>;
  parseInvoice(invoice: string): Promise<ParseInvoiceResult>;
  getInvoice(paymentHash: string): Promise<GetInvoiceResult>;

  canPay(params: CanPayParams): Promise<PaymentReadinessResult>;
  sendPayment(params: SendPaymentParams): Promise<SendPaymentResult>;
  getPayment(paymentHash: string): Promise<GetPaymentResult>;

  on<EventName extends FiberEventName>(
    event: EventName,
    listener: FiberEventListener<EventName>,
  ): () => void;
}

/* ---------------------------------------------------------------------- */
/* Events                                                                  */
/* ---------------------------------------------------------------------- */

export type FiberEventMap = {
  connect: FiberPermissionGrant;
  disconnect: { providerType: FiberProviderType };
  "invoice:created": MakeInvoiceResult;
  "payment:created": SendPaymentResult;
  "payment:pending": SendPaymentResult;
  "payment:succeeded": SendPaymentResult;
  "payment:failed": SendPaymentResult;
  "readiness:checked": PaymentReadinessResult;
  error: { message: string; code?: string; details?: unknown };
};

export type FiberEventName = keyof FiberEventMap;

export type FiberEventListener<EventName extends FiberEventName> = (
  payload: FiberEventMap[EventName],
) => void;

/* ---------------------------------------------------------------------- */
/* Payment request format                                                  */
/* ---------------------------------------------------------------------- */

export type FiberPaymentRequest = {
  type: "fiber-payment-request";
  version: string;
  network: FiberNetwork;
  invoice: string;
  amount?: string;
  currency?: FiberCurrency;
  description?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
};
