import type {
  CalendarProviderAdapter,
  ExternalEventBody,
  OAuthTokenSet,
} from "@/lib/calendar/providers/types";

function clientId() {
  return process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() || "";
}
function clientSecret() {
  return process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() || "";
}

function toGoogleDate(date: Date) {
  return { dateTime: date.toISOString() };
}

function mapEvent(event: ExternalEventBody) {
  return {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: toGoogleDate(event.start),
    end: toGoogleDate(event.end),
    status: event.status === "TENTATIVE" ? "tentative" : "confirmed",
    iCalUID: event.iCalUID,
  };
}

export const googleCalendarAdapter: CalendarProviderAdapter = {
  id: "GOOGLE",
  label: "Google Agenda",
  isConfigured: () => Boolean(clientId() && clientSecret()),
  buildAuthUrl({ state, redirectUri }) {
    const params = new URLSearchParams({
      client_id: clientId(),
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar.events email openid",
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },
  async exchangeCode({ code, redirectUri }) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId(),
        client_secret: clientSecret(),
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      throw new Error(`Google token exchange falhou (HTTP ${res.status})`);
    }
    const json = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      id_token?: string;
    };
    let accountEmail: string | null = null;
    if (json.id_token) {
      try {
        const payload = JSON.parse(
          Buffer.from(json.id_token.split(".")[1]!, "base64url").toString("utf8"),
        ) as { email?: string };
        accountEmail = payload.email ?? null;
      } catch {
        accountEmail = null;
      }
    }
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? null,
      expiresAt: json.expires_in
        ? new Date(Date.now() + json.expires_in * 1000)
        : null,
      accountEmail,
    } satisfies OAuthTokenSet;
  },
  async refresh(refreshToken) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId(),
        client_secret: clientSecret(),
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      throw new Error(`Google refresh falhou (HTTP ${res.status})`);
    }
    const json = (await res.json()) as {
      access_token: string;
      expires_in?: number;
      refresh_token?: string;
    };
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? refreshToken,
      expiresAt: json.expires_in
        ? new Date(Date.now() + json.expires_in * 1000)
        : null,
      accountEmail: null,
    };
  },
  async upsertEvent({ accessToken, calendarId, event, externalEventId }) {
    const cal = encodeURIComponent(calendarId || "primary");
    const body = JSON.stringify(mapEvent(event));
    if (externalEventId) {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${cal}/events/${encodeURIComponent(externalEventId)}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body,
          signal: AbortSignal.timeout(12_000),
        },
      );
      if (res.ok) {
        const json = (await res.json()) as { id: string };
        return { externalEventId: json.id };
      }
      if (res.status !== 404) {
        throw new Error(`Google update event falhou (HTTP ${res.status})`);
      }
    }
    const create = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${cal}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body,
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!create.ok) {
      throw new Error(`Google create event falhou (HTTP ${create.status})`);
    }
    const json = (await create.json()) as { id: string };
    return { externalEventId: json.id };
  },
  async deleteEvent({ accessToken, calendarId, externalEventId }) {
    const cal = encodeURIComponent(calendarId || "primary");
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${cal}/events/${encodeURIComponent(externalEventId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok && res.status !== 404 && res.status !== 410) {
      throw new Error(`Google delete event falhou (HTTP ${res.status})`);
    }
  },
};
