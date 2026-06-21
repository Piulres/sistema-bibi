import "server-only";
import { communicationGateway } from "@/lib/communications/communication-gateway";
import type { CommunicationProviderId } from "@/lib/communications/types";
import type { SendMessageRequest, SendMessageResult } from "@/lib/communications/types";

/**
 * Fachada de comunicacao — ponto de entrada para modulos de negocio.
 * Delega ao Strategy correto via CommunicationGatewayRegistry.
 */
export async function sendEmail(
  request: SendMessageRequest,
  providerId?: CommunicationProviderId,
): Promise<SendMessageResult> {
  const provider = communicationGateway.getEmailProvider(providerId);
  return provider.sendEmail(request);
}

export async function sendSms(
  request: SendMessageRequest,
  providerId?: CommunicationProviderId,
): Promise<SendMessageResult> {
  const provider = communicationGateway.getSmsProvider(providerId);
  return provider.sendSms(request);
}

export async function sendWhatsApp(
  request: SendMessageRequest,
  providerId?: CommunicationProviderId,
): Promise<SendMessageResult> {
  const provider = communicationGateway.getWhatsAppProvider(providerId);
  return provider.sendWhatsApp(request);
}

export function isCommunicationProviderConfigured(
  providerId?: CommunicationProviderId,
): boolean {
  return communicationGateway.isConfigured(providerId);
}
