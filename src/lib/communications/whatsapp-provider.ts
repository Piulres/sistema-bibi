import type { NotificationProvider } from "@/lib/communications/notification-provider";
import type { SendMessageRequest, SendMessageResult } from "@/lib/communications/types";

/** Contrato para envio via WhatsApp Business API. */
export interface WhatsAppProvider extends NotificationProvider {
  sendWhatsApp(request: SendMessageRequest): Promise<SendMessageResult>;
}

export function isWhatsAppProvider(
  provider: NotificationProvider,
): provider is WhatsAppProvider {
  return (
    provider.supportedChannels.includes("WHATSAPP") && "sendWhatsApp" in provider
  );
}
