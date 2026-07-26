import crypto from "node:crypto";
import type {
  CalendarProviderAdapter,
  CalendarProviderId,
  OAuthTokenSet,
} from "@/lib/calendar/providers/types";

/** Adapter de teste / demos sem credenciais reais. */
export function createMockCalendarAdapter(
  id: CalendarProviderId,
  label: string,
): CalendarProviderAdapter {
  return {
    id,
    label,
    isConfigured: () => true,
    buildAuthUrl: ({ state, redirectUri }) =>
      `${redirectUri}?mock=1&code=mock-${id.toLowerCase()}&state=${encodeURIComponent(state)}`,
    exchangeCode: async () =>
      ({
        accessToken: `mock-access-${id}`,
        refreshToken: `mock-refresh-${id}`,
        expiresAt: new Date(Date.now() + 3600_000),
        accountEmail: id === "GOOGLE" ? "mock.google@bibi.health" : "mock.microsoft@bibi.health",
      }) satisfies OAuthTokenSet,
    refresh: async (refreshToken) => ({
      accessToken: `mock-access-refreshed-${id}`,
      refreshToken,
      expiresAt: new Date(Date.now() + 3600_000),
      accountEmail: null,
    }),
    upsertEvent: async ({ externalEventId }) => ({
      externalEventId: externalEventId || `mock-evt-${crypto.randomBytes(8).toString("hex")}`,
    }),
    deleteEvent: async () => undefined,
  };
}
