import type { PaymentProvider } from "@/lib/payments/payment-provider";
import type { PixProvider } from "@/lib/payments/pix-provider";
import type {
  ChargeStatusResult,
  CreateChargeRequest,
  PixChargeRequest,
  PixChargeResult,
} from "@/lib/payments/types";

/**
 * Adapter PIX de demonstração — gera QR/copia-e-cola fictícios.
 * Confirmação de pagamento é feita pela camada de negócio (invoice-service).
 */
export class MockPixAdapter implements PixProvider {
  readonly gatewayId = "mock" as const;
  readonly supportedMethods = ["PIX"] as const;
  readonly method = "PIX" as const;

  async createPixCharge(request: PixChargeRequest): Promise<PixChargeResult> {
    const externalId = `mock_pix_${request.reference.invoiceId}_${Date.now()}`;
    const amount = request.amount.amount.toFixed(2);
    const expiresAt = new Date(
      Date.now() + (request.expiresInSeconds ?? 3600) * 1000,
    );

    return {
      externalId,
      gatewayId: "mock",
      method: "PIX",
      status: "PENDING",
      amount: request.amount,
      createdAt: new Date(),
      pixCopyPaste: `00020126580014BR.GOV.BCB.PIX0136${externalId}52040000530398654${amount.replace(".", "")}5802BR5925SISTEMA BIBI POC6009SAO PAULO62070503***6304MOCK`,
      qrCodePayload: `mock-qr:${externalId}:${amount}`,
      expiresAt,
    };
  }

  async createCharge(request: CreateChargeRequest): Promise<ChargeStatusResult> {
    return this.createPixCharge(request);
  }

  async getCharge(externalId: string): Promise<ChargeStatusResult> {
    return {
      externalId,
      gatewayId: "mock",
      method: "PIX",
      status: "PENDING",
      amount: { amount: 0, currency: "BRL" },
      createdAt: new Date(),
    };
  }

  async cancelCharge(externalId: string): Promise<ChargeStatusResult> {
    return {
      externalId,
      gatewayId: "mock",
      method: "PIX",
      status: "CANCELLED",
      amount: { amount: 0, currency: "BRL" },
      createdAt: new Date(),
    };
  }
}

export function isMockPixAdapter(provider: PaymentProvider): provider is MockPixAdapter {
  return provider.gatewayId === "mock";
}
