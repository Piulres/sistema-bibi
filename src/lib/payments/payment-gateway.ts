import "server-only";
import type { BoletoProvider } from "@/lib/payments/boleto-provider";
import type { CardProvider } from "@/lib/payments/card-provider";
import { PaymentProviderNotConfiguredError } from "@/lib/payments/errors";
import type { PaymentProvider } from "@/lib/payments/payment-provider";
import type { PixProvider } from "@/lib/payments/pix-provider";
import {
  PAYMENT_GATEWAY_IDS,
  type PaymentGatewayId,
  type PaymentMethod,
} from "@/lib/payments/types";

function resolveDefaultGatewayId(): PaymentGatewayId | null {
  const configured = process.env.PAYMENT_GATEWAY?.trim().toLowerCase();
  if (!configured) return null;
  if ((PAYMENT_GATEWAY_IDS as readonly string[]).includes(configured)) {
    return configured as PaymentGatewayId;
  }
  return null;
}

/**
 * Registry Strategy — seleciona o adapter correto por gateway e método.
 * Adapters concretos (Asaas, Efí, Inter) serão registrados na inicialização futura.
 */
export class PaymentGatewayRegistry {
  private readonly byGateway = new Map<PaymentGatewayId, PaymentProvider>();

  register(provider: PaymentProvider): void {
    this.byGateway.set(provider.gatewayId, provider);
  }

  getProvider(gatewayId?: PaymentGatewayId): PaymentProvider {
    if (gatewayId) {
      const explicit = this.byGateway.get(gatewayId);
      if (!explicit) {
        throw new PaymentProviderNotConfiguredError(gatewayId, "ANY");
      }
      return explicit;
    }

    const configured = resolveDefaultGatewayId();
    if (configured) {
      const provider = this.byGateway.get(configured);
      if (provider) return provider;
    }

    const registered = this.listRegisteredGateways();
    if (registered.length === 1) {
      return this.byGateway.get(registered[0])!;
    }

    throw new PaymentProviderNotConfiguredError("none", "ANY");
  }

  getPixProvider(gatewayId?: PaymentGatewayId): PixProvider {
    const provider = this.getProvider(gatewayId);
    if (!provider.supportedMethods.includes("PIX") || !("createPixCharge" in provider)) {
      throw new PaymentProviderNotConfiguredError(
        provider.gatewayId,
        "PIX" satisfies PaymentMethod,
      );
    }
    return provider as PixProvider;
  }

  getBoletoProvider(gatewayId?: PaymentGatewayId): BoletoProvider {
    const provider = this.getProvider(gatewayId);
    if (!provider.supportedMethods.includes("BOLETO") || !("createBoletoCharge" in provider)) {
      throw new PaymentProviderNotConfiguredError(
        provider.gatewayId,
        "BOLETO" satisfies PaymentMethod,
      );
    }
    return provider as BoletoProvider;
  }

  getCardProvider(gatewayId?: PaymentGatewayId): CardProvider {
    const provider = this.getProvider(gatewayId);
    if (!provider.supportedMethods.includes("CARD") || !("createCardCharge" in provider)) {
      throw new PaymentProviderNotConfiguredError(
        provider.gatewayId,
        "CARD" satisfies PaymentMethod,
      );
    }
    return provider as CardProvider;
  }

  listRegisteredGateways(): PaymentGatewayId[] {
    return [...this.byGateway.keys()];
  }

  isConfigured(gatewayId?: PaymentGatewayId): boolean {
    try {
      this.getProvider(gatewayId);
      return true;
    } catch {
      return false;
    }
  }
}

/** Instância singleton do registry (adapters registrados em bootstrap futuro). */
export const paymentGateway = new PaymentGatewayRegistry();

export { resolveDefaultGatewayId };
