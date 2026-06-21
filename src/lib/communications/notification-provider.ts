import type {
  CommunicationChannel,
  CommunicationProviderId,
  SendMessageRequest,
  SendMessageResult,
} from "@/lib/communications/types";

/**
 * Contrato base de um provedor de comunicacao.
 * Implementacoes concretas ficam em `adapters/` (SendGrid, Twilio, Meta).
 */
export interface NotificationProvider {
  readonly providerId: CommunicationProviderId;
  readonly supportedChannels: readonly CommunicationChannel[];

  sendMessage(request: SendMessageRequest): Promise<SendMessageResult>;
  getDeliveryStatus(externalId: string): Promise<SendMessageResult>;
}
