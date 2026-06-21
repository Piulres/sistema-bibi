export type {
  CommunicationChannel,
  CommunicationProviderId,
  MessageRecipient,
  MessageReference,
  MessageStatus,
  MessageTemplate,
  SendMessageRequest,
  SendMessageResult,
} from "@/lib/communications/types";

export {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_PROVIDER_IDS,
  MESSAGE_STATUSES,
  MESSAGE_TEMPLATES,
} from "@/lib/communications/types";

export type { NotificationProvider } from "@/lib/communications/notification-provider";
export type { EmailProvider } from "@/lib/communications/email-provider";
export type { SmsProvider } from "@/lib/communications/sms-provider";
export type { WhatsAppProvider } from "@/lib/communications/whatsapp-provider";

export {
  CommunicationError,
  CommunicationOperationNotSupportedError,
  CommunicationProviderNotConfiguredError,
} from "@/lib/communications/errors";

export {
  CommunicationGatewayRegistry,
  communicationGateway,
  resolveDefaultProviderId,
} from "@/lib/communications/communication-gateway";

export {
  isCommunicationProviderConfigured,
  sendEmail,
  sendSms,
  sendWhatsApp,
} from "@/lib/communications/notification-service";

export { isEmailProvider } from "@/lib/communications/email-provider";
export { isSmsProvider } from "@/lib/communications/sms-provider";
export { isWhatsAppProvider } from "@/lib/communications/whatsapp-provider";
