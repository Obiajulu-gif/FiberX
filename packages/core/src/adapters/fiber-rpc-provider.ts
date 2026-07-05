/**
 * FiberRpcProvider — the Fiber Network JSON-RPC compatibility layer.
 *
 * ⚠️  Fiber Network's RPC surface is still evolving. THIS FILE IS THE SINGLE
 *     PLACE that maps SDK concepts to concrete RPC method names and response
 *     shapes. If the node's API changes, update the `FIBER_RPC_METHODS` table
 *     and the `normalize*` helpers below — nothing else in the SDK should need
 *     to change.
 *
 * Field names below reflect the Fiber Network Node (FNN) conventions at the
 * time of writing: snake_case keys and `0x`-hex encoded integers. We normalise
 * everything to the SDK's camelCase + decimal-string types, and always keep the
 * untouched response under `raw` / `details` for debugging and forward-compat.
 */

import { JsonRpcTransport } from "../transports/json-rpc-transport.js";
import { FiberEventEmitter } from "../events.js";
import { checkPaymentReadiness } from "../readiness.js";
import { hexToDecimalString, isHexString, toDecimalString } from "../hex.js";
import type {
  CanPayParams,
  FiberBalance,
  FiberChannel,
  FiberCurrency,
  FiberEventListener,
  FiberEventName,
  FiberNetwork,
  FiberNodeInfo,
  FiberPermissionGrant,
  FiberProvider,
  FiberProviderMeta,
  GetBalanceParams,
  GetInvoiceResult,
  GetPaymentResult,
  ListChannelsParams,
  MakeInvoiceParams,
  MakeInvoiceResult,
  ParseInvoiceResult,
  PaymentReadinessResult,
  PaymentStatus,
  SendPaymentParams,
  SendPaymentResult,
} from "../types.js";

/**
 * All Fiber RPC method names live here. Change these — and only these — if the
 * node renames a method.
 */
export const FIBER_RPC_METHODS = {
  nodeInfo: "node_info",
  listChannels: "list_channels",
  newInvoice: "new_invoice",
  parseInvoice: "parse_invoice",
  getInvoice: "get_invoice",
  sendPayment: "send_payment",
  getPayment: "get_payment",
  listPayments: "list_payments",
} as const;

export type FiberRpcProviderOptions = {
  appName: string;
  network: FiberNetwork;
};

type UnknownRecord = Record<string, unknown>;

export class FiberRpcProvider implements FiberProvider {
  readonly meta: FiberProviderMeta;
  private readonly emitter = new FiberEventEmitter();
  private connected = false;

  constructor(
    private readonly transport: JsonRpcTransport,
    private readonly options: FiberRpcProviderOptions,
  ) {
    this.meta = {
      type: "rpc",
      label: "Fiber Node (JSON-RPC)",
      network: options.network,
    };
  }

  on<EventName extends FiberEventName>(
    event: EventName,
    listener: FiberEventListener<EventName>,
  ): () => void {
    return this.emitter.on(event, listener);
  }

  isConnected(): boolean {
    return this.connected;
  }

  async enable(): Promise<FiberPermissionGrant> {
    // Probe the node to confirm connectivity.
    await this.getInfo();
    this.connected = true;
    const grant: FiberPermissionGrant = {
      appName: this.options.appName,
      network: this.options.network,
      scopes: ["info", "channels", "invoices", "readiness", "payments"],
      grantedAt: new Date().toISOString(),
      providerType: "rpc",
    };
    this.emitter.emit("connect", grant);
    return grant;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.emitter.emit("disconnect", { providerType: "rpc" });
  }

  /* -------------------------------------------------------------------- */
  /* Node info                                                            */
  /* -------------------------------------------------------------------- */

  async getInfo(): Promise<FiberNodeInfo> {
    const raw = await this.transport.request<UnknownRecord>(
      FIBER_RPC_METHODS.nodeInfo,
    );
    return this.normalizeNodeInfo(raw);
  }

  private normalizeNodeInfo(raw: UnknownRecord): FiberNodeInfo {
    return {
      version: str(raw.version),
      commitHash: str(raw.commit_hash ?? raw.commitHash),
      pubkey: str(raw.node_id ?? raw.public_key ?? raw.pubkey) ?? "",
      nodeName: str(raw.node_name ?? raw.nodeName),
      addresses: toStringArray(raw.addresses ?? raw.peer_addresses),
      chainHash: str(raw.chain_hash ?? raw.chainHash),
      features: toStringArray(raw.features),
      channelCount: toNumber(raw.channel_count ?? raw.channelCount),
      pendingChannelCount: toNumber(
        raw.pending_channel_count ?? raw.pendingChannelCount,
      ),
      peersCount: toNumber(raw.peers_count ?? raw.peersCount ?? raw.n_peers),
      network: this.options.network,
    };
  }

  /* -------------------------------------------------------------------- */
  /* Channels + balance                                                   */
  /* -------------------------------------------------------------------- */

  async listChannels(params?: ListChannelsParams): Promise<FiberChannel[]> {
    const rpcParams: UnknownRecord = {};
    if (params?.peerPubkey) rpcParams.peer_id = params.peerPubkey;
    const raw = await this.transport.request<UnknownRecord>(
      FIBER_RPC_METHODS.listChannels,
      [rpcParams],
    );
    const channels = Array.isArray(raw.channels)
      ? (raw.channels as UnknownRecord[])
      : [];
    return channels.map((c) => this.normalizeChannel(c));
  }

  private normalizeChannel(raw: UnknownRecord): FiberChannel {
    const stateName =
      str(raw.state_name ?? raw.stateName ?? asStateName(raw.state)) ??
      "Unknown";
    const currency = this.normalizeCurrency(raw);
    return {
      channelId: str(raw.channel_id ?? raw.channelId) ?? "",
      stateName,
      peerPubkey: str(raw.peer_id ?? raw.peerPubkey ?? raw.remote_pubkey) ?? "",
      fundingAmount: optDecimal(
        raw.funding_amount ?? raw.local_balance ?? raw.capacity,
      ),
      localBalance: decimalOrZero(raw.local_balance ?? raw.localBalance),
      remoteBalance: decimalOrZero(raw.remote_balance ?? raw.remoteBalance),
      currency,
      public: Boolean(raw.is_public ?? raw.public ?? false),
      isReady: isReadyState(stateName),
    };
  }

  private normalizeCurrency(raw: UnknownRecord): FiberCurrency {
    // Fiber channels are either native CKB or a UDT (e.g. RGB++ asset / RUSD).
    const udt = raw.udt_type_script ?? raw.udtTypeScript;
    if (udt) {
      return {
        code: str(raw.asset_code ?? raw.currency) ?? "UDT",
        decimals: toNumber(raw.decimals ?? raw.udt_decimals) || undefined,
        udtTypeScript: udt,
      };
    }
    return { code: "CKB", displayName: "CKB", decimals: 8 };
  }

  async getBalance(params?: GetBalanceParams): Promise<FiberBalance> {
    // Fiber has no dedicated balance RPC yet; aggregate from channels.
    const channels = await this.listChannels();
    const byCurrencyMap = new Map<
      string,
      {
        currency: FiberCurrency;
        local: bigint;
        remote: bigint;
        readyLocal: bigint;
        readyRemote: bigint;
      }
    >();
    for (const c of channels) {
      if (params?.currencyCode && c.currency.code !== params.currencyCode) {
        continue;
      }
      const e = byCurrencyMap.get(c.currency.code) ?? {
        currency: c.currency,
        local: 0n,
        remote: 0n,
        readyLocal: 0n,
        readyRemote: 0n,
      };
      e.local += BigInt(c.localBalance);
      e.remote += BigInt(c.remoteBalance);
      if (c.isReady) {
        e.readyLocal += BigInt(c.localBalance);
        e.readyRemote += BigInt(c.remoteBalance);
      }
      byCurrencyMap.set(c.currency.code, e);
    }
    let tl = 0n;
    let tr = 0n;
    let rl = 0n;
    let rr = 0n;
    const byCurrency = [...byCurrencyMap.values()].map((e) => {
      tl += e.local;
      tr += e.remote;
      rl += e.readyLocal;
      rr += e.readyRemote;
      return {
        currency: e.currency,
        localBalance: e.local.toString(),
        remoteBalance: e.remote.toString(),
        readyLocalBalance: e.readyLocal.toString(),
        readyRemoteBalance: e.readyRemote.toString(),
      };
    });
    return {
      totalLocalBalance: tl.toString(),
      totalRemoteBalance: tr.toString(),
      readyLocalBalance: rl.toString(),
      readyRemoteBalance: rr.toString(),
      byCurrency,
    };
  }

  /* -------------------------------------------------------------------- */
  /* Invoices                                                             */
  /* -------------------------------------------------------------------- */

  async makeInvoice(params: MakeInvoiceParams): Promise<MakeInvoiceResult> {
    const rpcParams: UnknownRecord = {
      amount: params.amount,
      description: params.description,
      expiry: params.expirySeconds,
      currency: params.currency.code,
      payment_preimage: params.paymentPreimage,
      payment_hash: params.paymentHash,
      hash_algorithm: params.hashAlgorithm,
    };
    if (params.currency.udtTypeScript) {
      rpcParams.udt_type_script = params.currency.udtTypeScript;
    }
    const raw = await this.transport.request<UnknownRecord>(
      FIBER_RPC_METHODS.newInvoice,
      [pruneUndefined(rpcParams)],
    );
    const result = this.normalizeInvoiceResult(raw);
    this.emitter.emit("invoice:created", result);
    return result;
  }

  private normalizeInvoiceResult(raw: UnknownRecord): MakeInvoiceResult {
    const invoice = (raw.invoice ?? raw) as UnknownRecord;
    return {
      invoiceAddress:
        str(raw.invoice_address ?? invoice.invoice_address ?? raw.address) ?? "",
      paymentHash:
        str(raw.payment_hash ?? invoice.payment_hash ?? raw.hash) ?? "",
      invoice: raw,
      status: str(raw.status ?? invoice.status) ?? "Open",
    };
  }

  async parseInvoice(invoice: string): Promise<ParseInvoiceResult> {
    const raw = await this.transport.request<UnknownRecord>(
      FIBER_RPC_METHODS.parseInvoice,
      [invoice],
    );
    return this.normalizeParsedInvoice(invoice, raw);
  }

  private normalizeParsedInvoice(
    address: string,
    raw: UnknownRecord,
  ): ParseInvoiceResult {
    const data = (raw.invoice ?? raw) as UnknownRecord;
    return {
      invoiceAddress: str(data.invoice_address ?? address) ?? address,
      amount: optDecimal(data.amount),
      currency: data.currency
        ? { code: String(data.currency) }
        : { code: "CKB", decimals: 8 },
      description: str(data.description),
      paymentHash: str(data.payment_hash ?? data.hash),
      expiresAt: str(data.expires_at ?? data.expiry),
      payeePubkey: str(data.payee_pubkey ?? data.payee_public_key),
      raw,
    };
  }

  async getInvoice(paymentHash: string): Promise<GetInvoiceResult> {
    const raw = await this.transport.request<UnknownRecord>(
      FIBER_RPC_METHODS.getInvoice,
      [paymentHash],
    );
    const parsed = this.normalizeParsedInvoice("", raw);
    return { ...parsed, status: str(raw.status) ?? "Unknown" };
  }

  /* -------------------------------------------------------------------- */
  /* Payments + readiness                                                 */
  /* -------------------------------------------------------------------- */

  async canPay(params: CanPayParams): Promise<PaymentReadinessResult> {
    // Step 1: parse the invoice (if provided) for amount + currency.
    let amount = params.amount;
    let currencyCode = params.currency?.code;
    let invoiceValid = true;

    if (params.invoice) {
      try {
        const parsed = await this.parseInvoice(params.invoice);
        amount = amount ?? parsed.amount;
        currencyCode = currencyCode ?? parsed.currency?.code;
      } catch {
        invoiceValid = false;
      }
    }

    if (!invoiceValid) {
      const res = checkPaymentReadiness({ channels: [], invoiceValid: false });
      this.emitter.emit("readiness:checked", res);
      return res;
    }

    // Step 2: try a node-side dry run if the invoice is present.
    if (params.invoice) {
      try {
        const raw = await this.transport.request<UnknownRecord>(
          FIBER_RPC_METHODS.sendPayment,
          [
            pruneUndefined({
              invoice: params.invoice,
              dry_run: true,
              max_fee_amount: params.maxFeeAmount,
            }),
          ],
        );
        const fee = optDecimal(raw.fee ?? raw.fee_amount);
        const res: PaymentReadinessResult = {
          ok: true,
          code: "READY",
          message: "Payment appears payable (node dry-run succeeded).",
          estimatedFee: fee,
          routeConfidence: "high",
          details: { raw },
        };
        this.emitter.emit("readiness:checked", res);
        return res;
      } catch (err) {
        // Dry run unsupported or failed — fall through to local heuristic.
        void err;
      }
    }

    // Step 3: local heuristic fallback using channel state.
    const channels = (await this.listChannels()).filter((c) => c.isReady);
    const res = checkPaymentReadiness({
      channels,
      amount,
      currencyCode,
      invoiceValid: true,
      maxFeeAmount: params.maxFeeAmount,
    });
    this.emitter.emit("readiness:checked", res);
    return res;
  }

  async sendPayment(params: SendPaymentParams): Promise<SendPaymentResult> {
    const raw = await this.transport.request<UnknownRecord>(
      FIBER_RPC_METHODS.sendPayment,
      [
        pruneUndefined({
          invoice: params.invoice,
          max_fee_amount: params.maxFeeAmount,
          max_fee_rate: params.maxFeeRate,
          timeout: params.timeoutSeconds,
          dry_run: params.dryRun,
        }),
      ],
    );
    const result = this.normalizePayment(raw);
    if (result.status === "Failed") {
      this.emitter.emit("payment:failed", result);
    } else {
      this.emitter.emit("payment:created", result);
    }
    return result;
  }

  async getPayment(paymentHash: string): Promise<GetPaymentResult> {
    const raw = await this.transport.request<UnknownRecord>(
      FIBER_RPC_METHODS.getPayment,
      [paymentHash],
    );
    const base = this.normalizePayment(raw);
    return {
      ...base,
      createdAt: str(raw.created_at ?? raw.createdAt),
      lastUpdatedAt: str(raw.last_updated_at ?? raw.lastUpdatedAt),
    };
  }

  private normalizePayment(raw: UnknownRecord): SendPaymentResult {
    return {
      paymentHash: str(raw.payment_hash ?? raw.hash) ?? "",
      status: normalizeStatus(str(raw.status)),
      fee: optDecimal(raw.fee ?? raw.fee_amount),
      preimage: str(raw.payment_preimage ?? raw.preimage),
      failedError: str(raw.failed_error ?? raw.error) ?? null,
      raw,
    };
  }
}

/* ---------------------------------------------------------------------- */
/* Normalisation helpers                                                   */
/* ---------------------------------------------------------------------- */

function normalizeStatus(status: string | undefined): PaymentStatus {
  switch ((status ?? "").toLowerCase()) {
    case "created":
      return "Created";
    case "pending":
    case "inflight":
    case "in_flight":
      return "Pending";
    case "succeeded":
    case "success":
      return "Succeeded";
    case "failed":
      return "Failed";
    default:
      return "Unknown";
  }
}

function isReadyState(stateName: string): boolean {
  return /ready|normal|channelready/i.test(stateName);
}

function asStateName(state: unknown): string | undefined {
  if (typeof state === "string") return state;
  if (isRecord(state) && typeof state.state_name === "string") {
    return state.state_name;
  }
  return undefined;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    if (isHexString(value)) return Number(hexToDecimalString(value));
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function optDecimal(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    return toDecimalString(value as string | number | bigint);
  } catch {
    return undefined;
  }
}

function decimalOrZero(value: unknown): string {
  return optDecimal(value) ?? "0";
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  return [];
}

function pruneUndefined(obj: UnknownRecord): UnknownRecord {
  const out: UnknownRecord = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}
