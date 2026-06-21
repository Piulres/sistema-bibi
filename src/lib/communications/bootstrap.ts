import "server-only";
import { ConsoleEmailAdapter } from "@/lib/communications/adapters/console-email-adapter";
import { communicationGateway } from "@/lib/communications/communication-gateway";

let bootstrapped = false;

/** Registra adapters de comunicação conforme variáveis de ambiente. */
export function bootstrapCommunicationGateway(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  const provider = process.env.COMMUNICATION_PROVIDER?.trim().toLowerCase();
  if (provider === "console" || (!provider && process.env.NODE_ENV !== "production")) {
    communicationGateway.register(new ConsoleEmailAdapter());
  }
}

bootstrapCommunicationGateway();
