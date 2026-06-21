import type { EmailProvider } from "@/lib/communications/email-provider";
import type { NotificationProvider } from "@/lib/communications/notification-provider";
import type {
  CommunicationChannel,
  SendMessageRequest,
  SendMessageResult,
} from "@/lib/communications/types";

/**
 * Adapter POC — registra envios no console do servidor.
 * Permite demonstrar dispatch end-to-end sem SendGrid/Twilio.
 */
export class ConsoleEmailAdapter implements EmailProvider {
  readonly providerId = "console" as const;
  readonly supportedChannels = ["EMAIL", "SMS", "WHATSAPP"] as const;

  async sendEmail(request: SendMessageRequest): Promise<SendMessageResult> {
    return this.dispatch(request, "EMAIL");
  }

  async sendSms(request: SendMessageRequest): Promise<SendMessageResult> {
    return this.dispatch(request, "SMS");
  }

  async sendWhatsApp(request: SendMessageRequest): Promise<SendMessageResult> {
    return this.dispatch(request, "WHATSAPP");
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    if (request.channel === "EMAIL") return this.sendEmail(request);
    if (request.channel === "SMS") return this.sendSms(request);
    return this.sendWhatsApp(request);
  }

  async getDeliveryStatus(externalId: string): Promise<SendMessageResult> {
    return {
      externalId,
      providerId: "console",
      channel: "EMAIL",
      status: "SENT",
      sentAt: new Date(),
    };
  }

  private dispatch(
    request: SendMessageRequest,
    channel: CommunicationChannel,
  ): SendMessageResult {
    const externalId = `console_${channel.toLowerCase()}_${Date.now()}`;
    console.info("[Bibi POC Comunicação]", {
      channel,
      to: request.recipient.name,
      phone: request.recipient.phone,
      email: request.recipient.email,
      subject: request.subject,
      template: request.template,
      body: request.body.slice(0, 200),
    });

    return {
      externalId,
      providerId: "console",
      channel,
      status: "SENT",
      sentAt: new Date(),
    };
  }
}

export function isConsoleEmailAdapter(
  provider: NotificationProvider,
): provider is ConsoleEmailAdapter {
  return provider.providerId === "console";
}
