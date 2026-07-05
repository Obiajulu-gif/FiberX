/**
 * @fiberx/react — public API.
 *
 * Consumers should also import the stylesheet once:
 *   import "@fiberx/react/styles.css";
 */

export {
  FiberConnectProvider,
  FiberConnectContext,
  type FiberConnectProviderProps,
  type FiberConnectContextValue,
} from "./FiberConnectProvider.js";

export {
  useFiberConnect,
  useFiberProvider,
  useFiberChannels,
  useFiberInvoice,
  useFiberReadiness,
  useFiberPayment,
  type PaymentPhase,
} from "./hooks.js";

export {
  FiberConnectButton,
  type FiberConnectButtonProps,
} from "./components/FiberConnectButton.js";
export {
  FiberConnectModal,
  type FiberConnectModalProps,
} from "./components/FiberConnectModal.js";
export {
  FiberPaymentButton,
  type FiberPaymentButtonProps,
} from "./components/FiberPaymentButton.js";
export {
  FiberPaymentModal,
  type FiberPaymentModalProps,
} from "./components/FiberPaymentModal.js";
export {
  FiberReadinessBadge,
  type FiberReadinessBadgeProps,
} from "./components/FiberReadinessBadge.js";
export {
  FiberInvoiceCard,
  type FiberInvoiceCardProps,
} from "./components/FiberInvoiceCard.js";
export {
  FiberChannelList,
  type FiberChannelListProps,
} from "./components/FiberChannelList.js";

// Re-export commonly used core types for convenience.
export type {
  FiberProvider,
  FiberProviderType,
  FiberNetwork,
  FiberChannel,
  FiberCurrency,
  FiberNodeInfo,
  MakeInvoiceParams,
  MakeInvoiceResult,
  ParseInvoiceResult,
  PaymentReadinessResult,
  SendPaymentResult,
  GetPaymentResult,
} from "@fiberx/core";
