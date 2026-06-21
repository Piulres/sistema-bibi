import "server-only";
import { MockPixAdapter } from "@/lib/payments/adapters/mock-pix-adapter";
import { paymentGateway } from "@/lib/payments/payment-gateway";

let bootstrapped = false;

/** Registra adapters de pagamento conforme variáveis de ambiente. */
export function bootstrapPaymentGateway(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  const gateway = process.env.PAYMENT_GATEWAY?.trim().toLowerCase();
  if (gateway === "mock" || (!gateway && process.env.NODE_ENV !== "production")) {
    paymentGateway.register(new MockPixAdapter());
  }
}

bootstrapPaymentGateway();
