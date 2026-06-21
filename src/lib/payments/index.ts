export type {
  BoletoChargeRequest,
  BoletoChargeResult,
  CardChargeRequest,
  CardChargeResult,
  ChargeRecord,
  ChargeReference,
  ChargeStatus,
  ChargeStatusResult,
  CreateChargeRequest,
  MoneyAmount,
  PayerInfo,
  PaymentGatewayId,
  PaymentMethod,
  PixChargeRequest,
  PixChargeResult,
} from "@/lib/payments/types";

export {
  CHARGE_STATUSES,
  PAYMENT_GATEWAY_IDS,
  PAYMENT_METHODS,
} from "@/lib/payments/types";

export type { PaymentProvider } from "@/lib/payments/payment-provider";
export type { PixProvider } from "@/lib/payments/pix-provider";
export type { BoletoProvider } from "@/lib/payments/boleto-provider";
export type { CardProvider } from "@/lib/payments/card-provider";

export {
  PaymentError,
  PaymentOperationNotSupportedError,
  PaymentProviderNotConfiguredError,
} from "@/lib/payments/errors";

export {
  PaymentGatewayRegistry,
  paymentGateway,
  resolveDefaultGatewayId,
} from "@/lib/payments/payment-gateway";

export {
  createBoletoCharge,
  createCardCharge,
  createPixCharge,
  isPaymentGatewayConfigured,
} from "@/lib/payments/charge-service";

export { isPixProvider } from "@/lib/payments/pix-provider";
export { isBoletoProvider } from "@/lib/payments/boleto-provider";
export { isCardProvider } from "@/lib/payments/card-provider";
