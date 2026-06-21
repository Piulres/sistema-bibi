import type { NotificationProvider } from "@/lib/communications/notification-provider";
import type { SendMessageRequest, SendMessageResult } from "@/lib/communications/types";

/** Contrato para envio de e-mail transacional. */
export interface EmailProvider extends NotificationProvider {
  sendEmail(request: SendMessageRequest): Promise<SendMessageResult>;
}

export function isEmailProvider(
  provider: NotificationProvider,
): provider is EmailProvider {
  return (
    provider.supportedChannels.includes("EMAIL") && "sendEmail" in provider
  );
}
