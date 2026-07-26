import "server-only";
import crypto from "node:crypto";
import { getPrisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/landing/site-url";
import { buildIcsCalendar } from "@/lib/calendar/ics";
import { appointmentToIcsEvent } from "@/lib/calendar/appointment-event";

export const CALENDAR_FEED_SCOPES = ["PROVIDER", "TENANT"] as const;
export type CalendarFeedScope = (typeof CALENDAR_FEED_SCOPES)[number];

export function isCalendarFeedScope(value: string): value is CalendarFeedScope {
  return (CALENDAR_FEED_SCOPES as readonly string[]).includes(value);
}

function newFeedToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function calendarFeedPublicUrl(token: string): string {
  return `${getSiteUrl()}/api/calendar/feed/${token}`;
}

export type CalendarFeedView = {
  id: string;
  scope: CalendarFeedScope;
  label: string | null;
  active: boolean;
  createdAt: string;
  url: string;
  /** Instruções curtas por provedor. */
  subscribeHints: {
    google: string;
    outlook: string;
    apple: string;
  };
};

function toFeedView(feed: {
  id: string;
  scope: string;
  label: string | null;
  active: boolean;
  createdAt: Date;
  token: string;
}): CalendarFeedView {
  const url = calendarFeedPublicUrl(feed.token);
  return {
    id: feed.id,
    scope: feed.scope as CalendarFeedScope,
    label: feed.label,
    active: feed.active,
    createdAt: feed.createdAt.toISOString(),
    url,
    subscribeHints: {
      google:
        "Google Agenda → Outros calendários → + → A partir de URL → cole o link do feed.",
      outlook:
        "Outlook → Adicionar calendário → Subscrever a partir da web → cole o link do feed.",
      apple:
        "Apple Calendar → Arquivo → Nova inscrição de calendário → cole o link do feed.",
    },
  };
}

/** Retorna o feed ativo do escopo (um por usuário PROVIDER / um por tenant TENANT). */
export async function getActiveCalendarFeed(input: {
  tenantId: string;
  scope: CalendarFeedScope;
  userId?: string;
}): Promise<CalendarFeedView | null> {
  const prisma = await getPrisma();
  const feed = await prisma.calendarFeed.findFirst({
    where: {
      tenantId: input.tenantId,
      scope: input.scope,
      active: true,
      revokedAt: null,
      ...(input.scope === "PROVIDER"
        ? { userId: input.userId }
        : { userId: null }),
    },
    orderBy: { createdAt: "desc" },
  });
  return feed ? toFeedView(feed) : null;
}

/**
 * Cria (ou rotaciona) o feed: revoga o ativo anterior e emite novo token.
 * Rotação invalida URLs antigas — útil se o link vazar.
 */
export async function ensureCalendarFeed(input: {
  tenantId: string;
  scope: CalendarFeedScope;
  userId?: string;
  label?: string | null;
  rotate?: boolean;
}): Promise<CalendarFeedView> {
  const prisma = await getPrisma();

  if (input.scope === "PROVIDER" && !input.userId) {
    throw new Error("Feed PROVIDER exige userId do prestador");
  }

  const existing = await prisma.calendarFeed.findFirst({
    where: {
      tenantId: input.tenantId,
      scope: input.scope,
      active: true,
      revokedAt: null,
      ...(input.scope === "PROVIDER"
        ? { userId: input.userId }
        : { userId: null }),
    },
  });

  if (existing && !input.rotate) {
    return toFeedView(existing);
  }

  if (existing) {
    await prisma.calendarFeed.update({
      where: { id: existing.id },
      data: { active: false, revokedAt: new Date() },
    });
  }

  const created = await prisma.calendarFeed.create({
    data: {
      tenantId: input.tenantId,
      scope: input.scope,
      userId: input.scope === "PROVIDER" ? input.userId! : null,
      label:
        input.label?.trim() ||
        (input.scope === "PROVIDER" ? "Agenda do prestador" : "Agenda da operação"),
      token: newFeedToken(),
      active: true,
    },
  });

  return toFeedView(created);
}

export async function revokeCalendarFeed(input: {
  tenantId: string;
  feedId: string;
  userId?: string;
}): Promise<boolean> {
  const prisma = await getPrisma();
  const feed = await prisma.calendarFeed.findFirst({
    where: {
      id: input.feedId,
      tenantId: input.tenantId,
      ...(input.userId ? { userId: input.userId } : {}),
    },
  });
  if (!feed) return false;

  await prisma.calendarFeed.update({
    where: { id: feed.id },
    data: { active: false, revokedAt: new Date() },
  });
  return true;
}

const FEED_PAST_DAYS = 7;
const FEED_FUTURE_DAYS = 90;

/** Monta o corpo ICS do feed a partir do token público. */
export async function buildIcsForFeedToken(
  token: string,
): Promise<{ ics: string; calendarName: string } | null> {
  const prisma = await getPrisma();
  const feed = await prisma.calendarFeed.findFirst({
    where: { token, active: true, revokedAt: null },
    include: {
      tenant: { select: { name: true, niche: true } },
      user: { select: { name: true } },
    },
  });
  if (!feed) return null;

  const now = new Date();
  const from = new Date(now.getTime() - FEED_PAST_DAYS * 86_400_000);
  const to = new Date(now.getTime() + FEED_FUTURE_DAYS * 86_400_000);

  const rows = await prisma.appointment.findMany({
    where: {
      tenantId: feed.tenantId,
      scheduledAt: { gte: from, lte: to },
      ...(feed.scope === "PROVIDER" && feed.userId
        ? { providerId: feed.userId }
        : {}),
    },
    include: {
      patient: { select: { name: true } },
      pet: { select: { name: true } },
      provider: { select: { name: true } },
      procedure: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const calendarName =
    feed.label ||
    (feed.scope === "PROVIDER" && feed.user
      ? `Agenda — ${feed.user.name}`
      : `Agenda — ${feed.tenant.name}`);

  const events = rows.map((row) =>
    appointmentToIcsEvent({
      id: row.id,
      scheduledAt: row.scheduledAt,
      status: row.status,
      modality: row.modality,
      telemedicineUrl: row.telemedicineUrl,
      reason: row.reason,
      patientName: row.patient.name,
      petName: row.pet?.name ?? null,
      providerName: row.provider.name,
      procedureName: row.procedure?.name ?? null,
    }),
  );

  return {
    calendarName,
    ics: buildIcsCalendar({ calendarName, events }),
  };
}

export async function loadAppointmentForCalendar(input: {
  tenantId: string;
  appointmentId: string;
  providerId?: string;
}) {
  const prisma = await getPrisma();
  return prisma.appointment.findFirst({
    where: {
      id: input.appointmentId,
      tenantId: input.tenantId,
      ...(input.providerId ? { providerId: input.providerId } : {}),
    },
    include: {
      patient: { select: { name: true } },
      pet: { select: { name: true } },
      provider: { select: { name: true } },
      procedure: { select: { name: true } },
    },
  });
}
