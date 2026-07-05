/**
 * In-memory mock Fiber provider.
 *
 * This makes the entire SDK + demo fully functional without a real Fiber
 * node. It mirrors the semantics of a real node closely enough that swapping
 * in `FiberRpcProvider` requires no changes to app code.
 */

import { FiberEventEmitter } from "./events.js";
import { checkPaymentReadiness } from "./readiness.js";
import { parseFiberPaymentRequest } from "./payment-request.js";
import type {
  CanPayParams,
  FiberBalance,
  FiberChannel,
  FiberCurrency,
  FiberEventListener,
  FiberEventName,
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
  SendPaymentParams,
  SendPaymentResult,
} from "./types.js";

const MOCK_PUBKEY =
  "02mockfiberwalletconnectsdk000000000000000000000000000000000000000000000001";

const CKB: FiberCurrency = { code: "CKB", displayName: "CKB", decimals: 8 };
const RUSD: FiberCurrency = { code: "RUSD", displayName: "RUSD", decimals: 6 };

function mockChannels(): FiberChannel[] {
  return [
    {
      channelId: "0xmockchannel00000000000000000000000000000000000000000000000000ckb1",
      stateName: "ChannelReady",
      peerPubkey:
        "02peer000000000000000000000000000000000000000000000000000000000000aa",
      fundingAmount: "110000000000",
      localBalance: "80000000000", // 800 CKB
      remoteBalance: "30000000000",
      currency: CKB,
      public: true,
      isReady: true,
    },
    {
      channelId: "0xmockchannel00000000000000000000000000000000000000000000000rusd2",
      stateName: "ChannelReady",
      peerPubkey:
        "02peer000000000000000000000000000000000000000000000000000000000000bb",
      fundingAmount: "750000000",
      localBalance: "500000000",
      remoteBalance: "250000000",
      currency: RUSD,
      public: true,
      isReady: true,
    },
    {
      channelId: "0xmockchannel0000000000000000000000000000000000000000000pending3",
      stateName: "NegotiatingFunding",
      peerPubkey:
        "02peer000000000000000000000000000000000000000000000000000000000000cc",
      fundingAmount: "10000000000",
      localBalance: "10000000000",
      remoteBalance: "0",
      currency: CKB,
      public: false,
      isReady: false,
    },
  ];
}

type MockInvoice = {
  invoiceAddress: string;
  paymentHash: string;
  amount: string;
  currency: FiberCurrency;
  description?: string;
  expiresAt?: string;
  status: string;
};

type MockPayment = GetPaymentResult & {
  invoiceAddress: string;
};

export type MockProviderOptions = {
  appName?: string;
  /** Delay before enable() resolves, ms. Default 300. */
  enableDelayMs?: number;
  /** Delay before a payment settles, ms. Default 1000. */
  settleDelayMs?: number;
  /** Override the default mock channels. */
  channels?: FiberChannel[];
};

export class MockFiberProvider implements FiberProvider {
  readonly meta: FiberProviderMeta = {
    type: "mock",
    label: "Mock Fiber Wallet",
    network: "mock",
  };

  private readonly emitter = new FiberEventEmitter();
  private connected = false;
  private readonly channels: FiberChannel[];
  private readonly invoices = new Map<string, MockInvoice>();
  private readonly invoicesByHash = new Map<string, MockInvoice>();
  private readonly payments = new Map<string, MockPayment>();
  private counter = 0;

  private readonly appName: string;
  private readonly enableDelayMs: number;
  private readonly settleDelayMs: number;

  constructor(options: MockProviderOptions = {}) {
    this.appName = options.appName ?? "FiberX App";
    this.enableDelayMs = options.enableDelayMs ?? 300;
    this.settleDelayMs = options.settleDelayMs ?? 1000;
    this.channels = options.channels ?? mockChannels();
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
    await delay(this.enableDelayMs);
    this.connected = true;
    const grant: FiberPermissionGrant = {
      appName: this.appName,
      network: "mock",
      scopes: ["info", "channels", "invoices", "readiness", "payments"],
      grantedAt: new Date().toISOString(),
      providerType: "mock",
    };
    this.emitter.emit("connect", grant);
    return grant;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.emitter.emit("disconnect", { providerType: "mock" });
  }

  async getInfo(): Promise<FiberNodeInfo> {
    this.assertConnected();
    const pending = this.channels.filter((c) => !c.isReady).length;
    return {
      version: "0.1.0-mock",
      commitHash: "mock000",
      pubkey: MOCK_PUBKEY,
      nodeName: "Demo Fiber Wallet",
      addresses: ["/ip4/127.0.0.1/tcp/8228/mock"],
      chainHash: "0xmockchainhash",
      features: ["payments", "invoices", "channels", "readiness"],
      channelCount: this.channels.length,
      pendingChannelCount: pending,
      peersCount: 2,
      network: "mock",
    };
  }

  async listChannels(params?: ListChannelsParams): Promise<FiberChannel[]> {
    this.assertConnected();
    let channels = [...this.channels];
    if (params?.peerPubkey) {
      channels = channels.filter((c) => c.peerPubkey === params.peerPubkey);
    }
    if (!params?.includeClosed) {
      channels = channels.filter((c) => c.stateName !== "Closed");
    }
    return channels;
  }

  async getBalance(params?: GetBalanceParams): Promise<FiberBalance> {
    this.assertConnected();
    const byCurrencyMap = new Map<
      string,
      {
        currency: FiberCurrency;
        localBalance: bigint;
        remoteBalance: bigint;
        readyLocalBalance: bigint;
        readyRemoteBalance: bigint;
      }
    >();

    for (const c of this.channels) {
      if (params?.currencyCode && c.currency.code !== params.currencyCode) {
        continue;
      }
      const entry = byCurrencyMap.get(c.currency.code) ?? {
        currency: c.currency,
        localBalance: 0n,
        remoteBalance: 0n,
        readyLocalBalance: 0n,
        readyRemoteBalance: 0n,
      };
      entry.localBalance += BigInt(c.localBalance);
      entry.remoteBalance += BigInt(c.remoteBalance);
      if (c.isReady) {
        entry.readyLocalBalance += BigInt(c.localBalance);
        entry.readyRemoteBalance += BigInt(c.remoteBalance);
      }
      byCurrencyMap.set(c.currency.code, entry);
    }

    let totalLocal = 0n;
    let totalRemote = 0n;
    let readyLocal = 0n;
    let readyRemote = 0n;
    const byCurrency = [...byCurrencyMap.values()].map((e) => {
      totalLocal += e.localBalance;
      totalRemote += e.remoteBalance;
      readyLocal += e.readyLocalBalance;
      readyRemote += e.readyRemoteBalance;
      return {
        currency: e.currency,
        localBalance: e.localBalance.toString(),
        remoteBalance: e.remoteBalance.toString(),
        readyLocalBalance: e.readyLocalBalance.toString(),
        readyRemoteBalance: e.readyRemoteBalance.toString(),
      };
    });

    return {
      totalLocalBalance: totalLocal.toString(),
      totalRemoteBalance: totalRemote.toString(),
      readyLocalBalance: readyLocal.toString(),
      readyRemoteBalance: readyRemote.toString(),
      byCurrency,
    };
  }

  async makeInvoice(params: MakeInvoiceParams): Promise<MakeInvoiceResult> {
    this.assertConnected();
    const id = ++this.counter;
    const paymentHash =
      params.paymentHash ?? `0x${"m".repeat(2)}${pad(id)}${randomHex(52)}`;
    const invoiceAddress = `fibt_mock_${params.currency.code.toLowerCase()}_${pad(
      id,
    )}_${randomHex(12)}`;

    const invoice: MockInvoice = {
      invoiceAddress,
      paymentHash,
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      expiresAt: params.expirySeconds
        ? new Date(Date.now() + params.expirySeconds * 1000).toISOString()
        : undefined,
      status: "Open",
    };
    this.invoices.set(invoiceAddress, invoice);
    this.invoicesByHash.set(paymentHash, invoice);

    const result: MakeInvoiceResult = {
      invoiceAddress,
      paymentHash,
      invoice,
      status: "Open",
    };
    this.emitter.emit("invoice:created", result);
    return result;
  }

  async parseInvoice(invoice: string): Promise<ParseInvoiceResult> {
    this.assertConnected();
    // Accept fiber: encoded requests as well as raw mock invoice strings.
    const request = parseFiberPaymentRequest(invoice);
    const address = request.invoice;

    const known = this.invoices.get(address);
    if (known) {
      return {
        invoiceAddress: known.invoiceAddress,
        amount: known.amount,
        currency: known.currency,
        description: known.description,
        paymentHash: known.paymentHash,
        expiresAt: known.expiresAt,
        payeePubkey: MOCK_PUBKEY,
        raw: known,
      };
    }

    // Not one we issued. Derive best-effort data from the address/request.
    if (!address.startsWith("fibt_mock_")) {
      // Unknown format — still return something parseable but flagged.
      return {
        invoiceAddress: address,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        payeePubkey: undefined,
        raw: { unknown: true, request },
      };
    }

    const currencyCode = address.split("_")[2]?.toUpperCase() ?? "CKB";
    return {
      invoiceAddress: address,
      amount: request.amount,
      currency: request.currency ?? { code: currencyCode },
      description: request.description,
      payeePubkey: MOCK_PUBKEY,
      raw: { synthesized: true, request },
    };
  }

  async getInvoice(paymentHash: string): Promise<GetInvoiceResult> {
    this.assertConnected();
    const invoice = this.invoicesByHash.get(paymentHash);
    if (!invoice) {
      return {
        invoiceAddress: "",
        paymentHash,
        raw: null,
        status: "Unknown",
      };
    }
    return {
      invoiceAddress: invoice.invoiceAddress,
      amount: invoice.amount,
      currency: invoice.currency,
      description: invoice.description,
      paymentHash: invoice.paymentHash,
      expiresAt: invoice.expiresAt,
      payeePubkey: MOCK_PUBKEY,
      status: invoice.status,
      raw: invoice,
    };
  }

  async canPay(params: CanPayParams): Promise<PaymentReadinessResult> {
    this.assertConnected();

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

    const readyChannels = this.channels.filter((c) => c.isReady);
    const result = checkPaymentReadiness({
      channels: readyChannels,
      amount,
      currencyCode,
      invoiceValid,
      maxFeeAmount: params.maxFeeAmount,
    });
    this.emitter.emit("readiness:checked", result);
    return result;
  }

  async sendPayment(params: SendPaymentParams): Promise<SendPaymentResult> {
    this.assertConnected();

    const readiness = await this.canPay({
      invoice: params.invoice,
      maxFeeAmount: params.maxFeeAmount,
    });

    const parsed = await this.parseInvoice(params.invoice).catch(() => null);
    const paymentHash =
      parsed?.paymentHash ?? `0xpay${pad(++this.counter)}${randomHex(50)}`;

    if (!readiness.ok) {
      const failed: SendPaymentResult = {
        paymentHash,
        status: "Failed",
        failedError: `${readiness.code}: ${readiness.message}`,
        raw: { readiness },
      };
      this.payments.set(paymentHash, {
        ...failed,
        invoiceAddress: parsed?.invoiceAddress ?? params.invoice,
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      });
      this.emitter.emit("payment:failed", failed);
      return failed;
    }

    if (params.dryRun) {
      const dry: SendPaymentResult = {
        paymentHash,
        status: "Created",
        fee: readiness.estimatedFee,
        raw: { dryRun: true, readiness },
      };
      return dry;
    }

    const now = new Date().toISOString();
    const created: SendPaymentResult = {
      paymentHash,
      status: "Created",
      fee: readiness.estimatedFee,
      raw: { readiness },
    };
    const stored: MockPayment = {
      ...created,
      invoiceAddress: parsed?.invoiceAddress ?? params.invoice,
      createdAt: now,
      lastUpdatedAt: now,
    };
    this.payments.set(paymentHash, stored);
    this.emitter.emit("payment:created", created);

    // Transition Pending immediately, then Succeeded after settleDelayMs.
    const pending: SendPaymentResult = { ...created, status: "Pending" };
    this.updatePayment(paymentHash, { status: "Pending" });
    this.emitter.emit("payment:pending", pending);

    void delay(this.settleDelayMs).then(() => {
      const preimage = `0xpreimage${randomHex(56)}`;
      this.updatePayment(paymentHash, {
        status: "Succeeded",
        preimage,
      });
      const succeeded: SendPaymentResult = {
        ...created,
        status: "Succeeded",
        preimage,
      };
      // Mark the underlying invoice paid if we know it.
      const invoice = this.invoicesByHash.get(paymentHash);
      if (invoice) invoice.status = "Paid";
      this.emitter.emit("payment:succeeded", succeeded);
    });

    return created;
  }

  async getPayment(paymentHash: string): Promise<GetPaymentResult> {
    this.assertConnected();
    const payment = this.payments.get(paymentHash);
    if (!payment) {
      return {
        paymentHash,
        status: "Unknown",
        raw: null,
      };
    }
    const { invoiceAddress: _ignored, ...rest } = payment;
    return rest;
  }

  private updatePayment(
    paymentHash: string,
    patch: Partial<MockPayment>,
  ): void {
    const existing = this.payments.get(paymentHash);
    if (!existing) return;
    this.payments.set(paymentHash, {
      ...existing,
      ...patch,
      lastUpdatedAt: new Date().toISOString(),
    });
  }

  private assertConnected(): void {
    if (!this.connected) {
      throw new Error(
        "Mock Fiber provider is not connected. Call enable() first.",
      );
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pad(n: number): string {
  return n.toString().padStart(4, "0");
}

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
