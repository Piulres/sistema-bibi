export const CALENDAR_PROVIDERS = ["GOOGLE", "MICROSOFT"] as const;
export type CalendarProviderId = (typeof CALENDAR_PROVIDERS)[number];

export function isCalendarProviderId(value: string): value is CalendarProviderId {
  return (CALENDAR_PROVIDERS as readonly string[]).includes(value);
}

export type OAuthTokenSet = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  accountEmail: string | null;
};

export type ExternalEventBody = {
  summary: string;
  description: string;
  location?: string;
  start: Date;
  end: Date;
  /** CANCELLED → delete no provedor; demais → upsert */
  status: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  /** UID estável (appointment-…@bibi.serviceos) — ajuda em dedupe */
  iCalUID: string;
};

export type UpsertExternalEventResult = {
  externalEventId: string;
};

export interface CalendarProviderAdapter {
  id: CalendarProviderId;
  label: string;
  isConfigured(): boolean;
  buildAuthUrl(input: { state: string; redirectUri: string }): string;
  exchangeCode(input: {
    code: string;
    redirectUri: string;
  }): Promise<OAuthTokenSet>;
  refresh(refreshToken: string): Promise<OAuthTokenSet>;
  upsertEvent(input: {
    accessToken: string;
    calendarId: string;
    event: ExternalEventBody;
    externalEventId?: string | null;
  }): Promise<UpsertExternalEventResult>;
  deleteEvent(input: {
    accessToken: string;
    calendarId: string;
    externalEventId: string;
  }): Promise<void>;
}
