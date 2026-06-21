import type { PaymentProvider } from "@/lib/payments/payment-provider";
import type { CardChargeRequest, CardChargeResult } from "@/lib/payments/types";

/** Strategy para cobranças via cartão de crédito/débito (tokenizado). */
export interface CardProvider extends PaymentProvider {
  readonly method: "CARD";

  createCardCharge(request: CardChargeRequest): Promise<CardChargeResult>;
}

export function isCardProvider(provider: PaymentProvider): provider is CardProvider {
  return provider.supportedMethods.includes("CARD") && "createCardCharge" in provider;
}
