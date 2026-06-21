import "server-only";
import type { BoletoChargeRequest, BoletoChargeResult } from "@/lib/payments/types";
import type { CardChargeRequest, CardChargeResult } from "@/lib/payments/types";
import type { PixChargeRequest, PixChargeResult } from "@/lib/payments/types";
import type { PaymentGatewayId } from "@/lib/payments/types";
import { paymentGateway } from "@/lib/payments/payment-gateway";

/**
 * Fachada de cobrança — ponto de entrada para módulos de negócio (faturamento, recorrência).
 * Delega ao Strategy correto via PaymentGatewayRegistry.
 *
 * Integração com Invoice será feita nos épicos seguintes; aqui apenas orquestração tipada.
 */
export async function createPixCharge(
  request: PixChargeRequest,
  gatewayId?: PaymentGatewayId,
): Promise<PixChargeResult> {
  const provider = paymentGateway.getPixProvider(gatewayId);
  return provider.createPixCharge(request);
}

export async function createBoletoCharge(
  request: BoletoChargeRequest,
  gatewayId?: PaymentGatewayId,
): Promise<BoletoChargeResult> {
  const provider = paymentGateway.getBoletoProvider(gatewayId);
  return provider.createBoletoCharge(request);
}

export async function createCardCharge(
  request: CardChargeRequest,
  gatewayId?: PaymentGatewayId,
): Promise<CardChargeResult> {
  const provider = paymentGateway.getCardProvider(gatewayId);
  return provider.createCardCharge(request);
}

export function isPaymentGatewayConfigured(gatewayId?: PaymentGatewayId): boolean {
  return paymentGateway.isConfigured(gatewayId);
}
