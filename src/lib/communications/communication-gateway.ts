import "server-only";
import type { EmailProvider } from "@/lib/communications/email-provider";
import { CommunicationProviderNotConfiguredError } from "@/lib/communications/errors";
import type { NotificationProvider } from "@/lib/communications/notification-provider";
import type { SmsProvider } from "@/lib/communications/sms-provider";
import type { WhatsAppProvider } from "@/lib/communications/whatsapp-provider";
import {
  COMMUNICATION_PROVIDER_IDS,
  type CommunicationChannel,
  type CommunicationProviderId,
} from "@/lib/communications/types";

function resolveDefaultProviderId(): CommunicationProviderId | null {
  const configured = process.env.COMMUNICATION_PROVIDER?.trim().toLowerCase();
  if (!configured) return null;
  if ((COMMUNICATION_PROVIDER_IDS as readonly string[]).includes(configured)) {
    return configured as CommunicationProviderId;
  }
  return null;
}

/**
 * Registry Strategy — seleciona o adapter correto por provider e canal.
 * Adapters concretos (SendGrid, Twilio, Meta) serao registrados na inicializacao futura.
 */
export class CommunicationGatewayRegistry {
  private readonly byProvider = new Map<CommunicationProviderId, NotificationProvider>();

  register(provider: NotificationProvider): void {
    this.byProvider.set(provider.providerId, provider);
  }

  getProvider(providerId?: CommunicationProviderId): NotificationProvider {
    const id = providerId ?? resolveDefaultProviderId();
    if (!id) {
      throw new CommunicationProviderNotConfiguredError("none", "ANY");
    }
    const provider = this.byProvider.get(id);
    if (!provider) {
      throw new CommunicationProviderNotConfiguredError(id, "ANY");
    }
    return provider;
  }

  getEmailProvider(providerId?: CommunicationProviderId): EmailProvider {
    const provider = this.getProvider(providerId);
    if (!provider.supportedChannels.includes("EMAIL") || !("sendEmail" in provider)) {
      throw new CommunicationProviderNotConfiguredError(
        provider.providerId,
        "EMAIL" satisfies CommunicationChannel,
      );
    }
    return provider as EmailProvider;
  }

  getSmsProvider(providerId?: CommunicationProviderId): SmsProvider {
    const provider = this.getProvider(providerId);
    if (!provider.supportedChannels.includes("SMS") || !("sendSms" in provider)) {
      throw new CommunicationProviderNotConfiguredError(
        provider.providerId,
        "SMS" satisfies CommunicationChannel,
      );
    }
    return provider as SmsProvider;
  }

  getWhatsAppProvider(providerId?: CommunicationProviderId): WhatsAppProvider {
    const provider = this.getProvider(providerId);
    if (
      !provider.supportedChannels.includes("WHATSAPP") ||
      !("sendWhatsApp" in provider)
    ) {
      throw new CommunicationProviderNotConfiguredError(
        provider.providerId,
        "WHATSAPP" satisfies CommunicationChannel,
      );
    }
    return provider as WhatsAppProvider;
  }

  listRegisteredProviders(): CommunicationProviderId[] {
    return [...this.byProvider.keys()];
  }

  isConfigured(providerId?: CommunicationProviderId): boolean {
    try {
      this.getProvider(providerId);
      return true;
    } catch {
      return false;
    }
  }
}

/** Instancia singleton do registry (adapters registrados em bootstrap futuro). */
export const communicationGateway = new CommunicationGatewayRegistry();

export { resolveDefaultProviderId };
