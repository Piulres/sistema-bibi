import "server-only";
import { getPrisma } from "@/lib/db";
import type { CalendarFeedScope } from "@/lib/calendar/calendar-feed-service";
import { decryptSecret, encryptSecret } from "@/lib/calendar/token-crypto";
import { getCalendarAdapter, listCalendarProviderStatus } from "@/lib/calendar/providers";
import type { CalendarProviderId, OAuthTokenSet } from "@/lib/calendar/providers/types";
import { getSiteUrl } from "@/lib/landing/site-url";

export type CalendarConnectionView = {
  id: string;
  provider: CalendarProviderId;
  scope: CalendarFeedScope;
  accountEmail: string | null;
  status: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  createdAt: string;
};

export function oauthRedirectUri(provider: CalendarProviderId): string {
  return `${getSiteUrl()}/api/calendar/oauth/${provider.toLowerCase()}/callback`;
}

export function oauthStartPath(
  provider: CalendarProviderId,
  scope: CalendarFeedScope,
  returnTo: string,
): string {
  const params = new URLSearchParams({
    scope,
    returnTo,
  });
  return `/api/calendar/oauth/${provider.toLowerCase()}/start?${params}`;
}

export async function listCalendarConnections(input: {
  tenantId: string;
  userId: string;
  scope: CalendarFeedScope;
}): Promise<{
  connections: CalendarConnectionView[];
  providers: ReturnType<typeof listCalendarProviderStatus>;
}> {
  const prisma = await getPrisma();
  const rows = await prisma.calendarConnection.findMany({
    where: {
      tenantId: input.tenantId,
      userId: input.userId,
      scope: input.scope,
      status: { not: "REVOKED" },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    connections: rows.map((r) => ({
      id: r.id,
      provider: r.provider as CalendarProviderId,
      scope: r.scope as CalendarFeedScope,
      accountEmail: r.accountEmail,
      status: r.status,
      lastSyncedAt: r.lastSyncedAt?.toISOString() ?? null,
      lastError: r.lastError,
      createdAt: r.createdAt.toISOString(),
    })),
    providers: listCalendarProviderStatus(),
  };
}

export async function upsertCalendarConnection(input: {
  tenantId: string;
  userId: string;
  scope: CalendarFeedScope;
  provider: CalendarProviderId;
  tokens: OAuthTokenSet;
}): Promise<CalendarConnectionView> {
  const prisma = await getPrisma();
  const data = {
    accountEmail: input.tokens.accountEmail,
    accessTokenEnc: encryptSecret(input.tokens.accessToken),
    refreshTokenEnc: input.tokens.refreshToken
      ? encryptSecret(input.tokens.refreshToken)
      : null,
    expiresAt: input.tokens.expiresAt,
    status: "ACTIVE",
    lastError: null,
    calendarId: "primary",
  };

  const row = await prisma.calendarConnection.upsert({
    where: {
      tenantId_userId_provider_scope: {
        tenantId: input.tenantId,
        userId: input.userId,
        provider: input.provider,
        scope: input.scope,
      },
    },
    create: {
      tenantId: input.tenantId,
      userId: input.userId,
      provider: input.provider,
      scope: input.scope,
      ...data,
      // preserve refresh if provider didn't return a new one on reconnect
      refreshTokenEnc: data.refreshTokenEnc,
    },
    update: {
      ...data,
      refreshTokenEnc: data.refreshTokenEnc ?? undefined,
    },
  });

  return {
    id: row.id,
    provider: row.provider as CalendarProviderId,
    scope: row.scope as CalendarFeedScope,
    accountEmail: row.accountEmail,
    status: row.status,
    lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
    lastError: row.lastError,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function revokeCalendarConnection(input: {
  tenantId: string;
  userId: string;
  provider: CalendarProviderId;
  scope: CalendarFeedScope;
}): Promise<boolean> {
  const prisma = await getPrisma();
  const existing = await prisma.calendarConnection.findUnique({
    where: {
      tenantId_userId_provider_scope: {
        tenantId: input.tenantId,
        userId: input.userId,
        provider: input.provider,
        scope: input.scope,
      },
    },
  });
  if (!existing) return false;

  await prisma.appointmentExternalEvent.deleteMany({
    where: { connectionId: existing.id },
  });
  await prisma.calendarConnection.update({
    where: { id: existing.id },
    data: {
      status: "REVOKED",
      accessTokenEnc: encryptSecret("revoked"),
      refreshTokenEnc: null,
      lastError: null,
    },
  });
  return true;
}

/** Garante access token válido (refresh se necessário). */
export async function getValidAccessToken(connectionId: string): Promise<{
  accessToken: string;
  calendarId: string;
  provider: CalendarProviderId;
} | null> {
  const prisma = await getPrisma();
  const connection = await prisma.calendarConnection.findFirst({
    where: { id: connectionId, status: "ACTIVE" },
  });
  if (!connection) return null;

  const provider = connection.provider as CalendarProviderId;
  const adapter = getCalendarAdapter(provider);
  const expiresSoon =
    connection.expiresAt &&
    connection.expiresAt.getTime() < Date.now() + 60_000;

  if (!expiresSoon) {
    return {
      accessToken: decryptSecret(connection.accessTokenEnc),
      calendarId: connection.calendarId,
      provider,
    };
  }

  if (!connection.refreshTokenEnc) {
    await prisma.calendarConnection.update({
      where: { id: connection.id },
      data: {
        status: "ERROR",
        lastError: "Sessão do calendário expirou — reconecte.",
      },
    });
    return null;
  }

  try {
    const refreshed = await adapter.refresh(decryptSecret(connection.refreshTokenEnc));
    await prisma.calendarConnection.update({
      where: { id: connection.id },
      data: {
        accessTokenEnc: encryptSecret(refreshed.accessToken),
        refreshTokenEnc: refreshed.refreshToken
          ? encryptSecret(refreshed.refreshToken)
          : connection.refreshTokenEnc,
        expiresAt: refreshed.expiresAt,
        status: "ACTIVE",
        lastError: null,
      },
    });
    return {
      accessToken: refreshed.accessToken,
      calendarId: connection.calendarId,
      provider,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao renovar token";
    await prisma.calendarConnection.update({
      where: { id: connection.id },
      data: { status: "ERROR", lastError: message },
    });
    return null;
  }
}
