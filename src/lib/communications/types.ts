/** Provedores de comunicacao previstos para integracao futura. */
export const COMMUNICATION_PROVIDER_IDS = ["console", "sendgrid", "twilio", "meta"] as const;

export type CommunicationProviderId = (typeof COMMUNICATION_PROVIDER_IDS)[number];

/** Canais suportados pelo motor de comunicacao. */
export const COMMUNICATION_CHANNELS = ["EMAIL", "SMS", "WHATSAPP"] as const;

export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

/** Templates de mensagem previstos. */
export const MESSAGE_TEMPLATES = [
  "APPOINTMENT_REMINDER",
  "INVOICE_DUE",
  "SUBSCRIPTION_DUE",
  "GENERIC",
] as const;

export type MessageTemplate = (typeof MESSAGE_TEMPLATES)[number];

/** Status de uma mensagem na fila ou apos dispatch. */
export const MESSAGE_STATUSES = ["PENDENTE", "ENVIADA", "FALHA", "CANCELADA"] as const;

export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export type MessageRecipient = {
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
};

export type MessageReference = {
  tenantId: string;
  patientId: string;
  messageId: string;
  companyId?: string | null;
};

export type SendMessageRequest = {
  reference: MessageReference;
  channel: CommunicationChannel;
  template: MessageTemplate;
  subject?: string | null;
  body: string;
  recipient: MessageRecipient;
  metadata?: Record<string, string>;
};

export type SendMessageResult = {
  externalId: string;
  providerId: CommunicationProviderId;
  channel: CommunicationChannel;
  status: "SENT" | "QUEUED";
  sentAt: Date;
};
