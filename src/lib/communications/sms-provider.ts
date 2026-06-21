import type { NotificationProvider } from "@/lib/communications/notification-provider";
import type { SendMessageRequest, SendMessageResult } from "@/lib/communications/types";

/** Contrato para envio de SMS. */
export interface SmsProvider extends NotificationProvider {
  sendSms(request: SendMessageRequest): Promise<SendMessageResult>;
}

export function isSmsProvider(provider: NotificationProvider): provider is SmsProvider {
  return provider.supportedChannels.includes("SMS") && "sendSms" in provider;
}
