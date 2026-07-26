import type {
  CalendarProviderAdapter,
  ExternalEventBody,
  OAuthTokenSet,
} from "@/lib/calendar/providers/types";

function clientId() {
  return process.env.MICROSOFT_CALENDAR_CLIENT_ID?.trim() || "";
}
function clientSecret() {
  return process.env.MICROSOFT_CALENDAR_CLIENT_SECRET?.trim() || "";
}
function tenant() {
  return process.env.MICROSOFT_CALENDAR_TENANT?.trim() || "common";
}

function mapEvent(event: ExternalEventBody) {
  return {
    subject: event.summary,
    body: {
      contentType: "Text",
      content: event.description,
    },
    location: event.location ? { displayName: event.location } : undefined,
    start: {
      dateTime: event.start.toISOString().replace(/\.\d{3}Z$/, ""),
      timeZone: "UTC",
    },
    end: {
      dateTime: event.end.toISOString().replace(/\.\d{3}Z$/, ""),
      timeZone: "UTC",
    },
    showAs: event.status === "TENTATIVE" ? "tentative" : "busy",
    iCalUId: event.iCalUID,
  };
}

async function fetchProfileEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { mail?: string; userPrincipalName?: string };
    return json.mail || json.userPrincipalName || null;
  } catch {
    return null;
  }
}

export const microsoftCalendarAdapter: CalendarProviderAdapter = {
  id: "MICROSOFT",
  label: "Microsoft Outlook",
  isConfigured: () => Boolean(clientId() && clientSecret()),
  buildAuthUrl({ state, redirectUri }) {
    const params = new URLSearchParams({
      client_id: clientId(),
      response_type: "code",
      redirect_uri: redirectUri,
      response_mode: "query",
      scope: "offline_access Calendars.ReadWrite User.Read openid email profile",
      state,
    });
    return `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/authorize?${params}`;
  },
  async exchangeCode({ code, redirectUri }) {
    const res = await fetch(
      `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId(),
          client_secret: clientSecret(),
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok) {
      throw new Error(`Microsoft token exchange falhou (HTTP ${res.status})`);
    }
    const json = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };
    const accountEmail = await fetchProfileEmail(json.access_token);
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
    const res = await fetch(
      `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId(),
          client_secret: clientSecret(),
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok) {
      throw new Error(`Microsoft refresh falhou (HTTP ${res.status})`);
    }
    const json = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
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
    const body = JSON.stringify(mapEvent(event));
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    if (externalEventId) {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(externalEventId)}`,
        {
          method: "PATCH",
          headers,
          body,
          signal: AbortSignal.timeout(12_000),
        },
      );
      if (res.ok) {
        const json = (await res.json()) as { id: string };
        return { externalEventId: json.id };
      }
      if (res.status !== 404) {
        throw new Error(`Microsoft update event falhou (HTTP ${res.status})`);
      }
    }
    const path =
      calendarId && calendarId !== "primary"
        ? `https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(calendarId)}/events`
        : "https://graph.microsoft.com/v1.0/me/events";
    const create = await fetch(path, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(12_000),
    });
    if (!create.ok) {
      throw new Error(`Microsoft create event falhou (HTTP ${create.status})`);
    }
    const json = (await create.json()) as { id: string };
    return { externalEventId: json.id };
  },
  async deleteEvent({ accessToken, externalEventId }) {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(externalEventId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok && res.status !== 404) {
      throw new Error(`Microsoft delete event falhou (HTTP ${res.status})`);
    }
  },
};
