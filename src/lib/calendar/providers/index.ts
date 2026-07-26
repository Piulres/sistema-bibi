import { createMockCalendarAdapter } from "@/lib/calendar/providers/mock";
import { googleCalendarAdapter } from "@/lib/calendar/providers/google";
import { microsoftCalendarAdapter } from "@/lib/calendar/providers/microsoft";
import type {
  CalendarProviderAdapter,
  CalendarProviderId,
} from "@/lib/calendar/providers/types";

/** `CALENDAR_OAUTH_MOCK=true` força adapters mock (testes / demo sem secrets). */
export function isCalendarOAuthMock(): boolean {
  return process.env.CALENDAR_OAUTH_MOCK === "true";
}

export function getCalendarAdapter(provider: CalendarProviderId): CalendarProviderAdapter {
  if (isCalendarOAuthMock()) {
    return createMockCalendarAdapter(
      provider,
      provider === "GOOGLE" ? "Google Agenda (mock)" : "Microsoft Outlook (mock)",
    );
  }
  return provider === "GOOGLE" ? googleCalendarAdapter : microsoftCalendarAdapter;
}

export function listCalendarProviderStatus(): Array<{
  id: CalendarProviderId;
  label: string;
  configured: boolean;
  mock: boolean;
}> {
  return (["GOOGLE", "MICROSOFT"] as const).map((id) => {
    const adapter = getCalendarAdapter(id);
    return {
      id,
      label: adapter.label,
      configured: adapter.isConfigured(),
      mock: isCalendarOAuthMock(),
    };
  });
}
