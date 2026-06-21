import type {
  ChargeStatusResult,
  CreateChargeRequest,
  PaymentGatewayId,
  PaymentMethod,
} from "@/lib/payments/types";

/**
 * Contrato base de um provedor de pagamento.
 * Implementações concretas ficam em `adapters/` (Asaas, Efí, Banco Inter).
 */
export interface PaymentProvider {
  readonly gatewayId: PaymentGatewayId;
  readonly supportedMethods: readonly PaymentMethod[];

  createCharge(request: CreateChargeRequest): Promise<ChargeStatusResult>;
  getCharge(externalId: string): Promise<ChargeStatusResult>;
  cancelCharge(externalId: string): Promise<ChargeStatusResult>;
}
