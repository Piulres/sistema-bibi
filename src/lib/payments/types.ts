/** Gateways de pagamento previstos para integração futura. */
export const PAYMENT_GATEWAY_IDS = ["asaas", "efi", "inter"] as const;

export type PaymentGatewayId = (typeof PAYMENT_GATEWAY_IDS)[number];

/** Métodos de cobrança suportados pelo motor. */
export const PAYMENT_METHODS = ["PIX", "BOLETO", "CARD"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Status de uma cobrança no gateway externo. */
export const CHARGE_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "RECEIVED",
  "OVERDUE",
  "CANCELLED",
  "FAILED",
] as const;

export type ChargeStatus = (typeof CHARGE_STATUSES)[number];

/** Referência interna — vincula cobrança a fatura Pay Per Use existente. */
export type ChargeReference = {
  tenantId: string;
  invoiceId: string;
  patientId: string;
  companyId?: string | null;
};

export type MoneyAmount = {
  /** Valor em reais (BRL). */
  amount: number;
  currency: "BRL";
};

export type PayerInfo = {
  name: string;
  email?: string;
  cpfCnpj: string;
  phone?: string;
};

export type CreateChargeRequest = {
  reference: ChargeReference;
  amount: MoneyAmount;
  payer: PayerInfo;
  description: string;
  dueDate?: Date;
  metadata?: Record<string, string>;
};

export type ChargeRecord = {
  /** ID da cobrança no gateway externo. */
  externalId: string;
  gatewayId: PaymentGatewayId;
  method: PaymentMethod;
  status: ChargeStatus;
  amount: MoneyAmount;
  createdAt: Date;
  paidAt?: Date | null;
};

export type PixChargeRequest = CreateChargeRequest & {
  /** Expiração do QR Code PIX em segundos (opcional). */
  expiresInSeconds?: number;
};

export type PixChargeResult = ChargeRecord & {
  method: "PIX";
  pixCopyPaste: string;
  qrCodePayload: string;
  expiresAt?: Date | null;
};

export type BoletoChargeRequest = CreateChargeRequest & {
  dueDate: Date;
};

export type BoletoChargeResult = ChargeRecord & {
  method: "BOLETO";
  barcode: string;
  digitableLine: string;
  pdfUrl?: string | null;
  dueDate: Date;
};

export type CardChargeRequest = CreateChargeRequest & {
  /** Token do cartão gerado pelo gateway (PCI — nunca PAN bruto). */
  cardToken: string;
  installments?: number;
};

export type CardChargeResult = ChargeRecord & {
  method: "CARD";
  authorizationCode?: string | null;
  installments: number;
};

export type ChargeStatusResult = ChargeRecord;
