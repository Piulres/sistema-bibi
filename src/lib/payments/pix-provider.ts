import type { PaymentProvider } from "@/lib/payments/payment-provider";
import type { PixChargeRequest, PixChargeResult } from "@/lib/payments/types";

/** Strategy para cobranças via PIX. */
export interface PixProvider extends PaymentProvider {
  readonly method: "PIX";

  createPixCharge(request: PixChargeRequest): Promise<PixChargeResult>;
}

export function isPixProvider(provider: PaymentProvider): provider is PixProvider {
  return provider.supportedMethods.includes("PIX") && "createPixCharge" in provider;
}
