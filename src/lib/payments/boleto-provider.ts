import type { PaymentProvider } from "@/lib/payments/payment-provider";
import type { BoletoChargeRequest, BoletoChargeResult } from "@/lib/payments/types";

/** Strategy para cobranças via boleto bancário. */
export interface BoletoProvider extends PaymentProvider {
  readonly method: "BOLETO";

  createBoletoCharge(request: BoletoChargeRequest): Promise<BoletoChargeResult>;
}

export function isBoletoProvider(provider: PaymentProvider): provider is BoletoProvider {
  return provider.supportedMethods.includes("BOLETO") && "createBoletoCharge" in provider;
}
