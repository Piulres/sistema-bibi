import "server-only";
import { getPrisma } from "@/lib/db";
import {
  defaultAvailabilityWindows,
  isValidWindow,
  minutesToLabel,
  type AvailabilityWindow,
  WEEKDAY_LABELS_PT,
} from "@/lib/availability/slot-grid";

export type WeeklyAvailabilityRow = {
  weekday: number;
  startMinute: number;
  endMinute: number;
  slotMinutes: number;
  active: boolean;
  startLabel: string;
  endLabel: string;
  weekdayLabel: string;
};

export type BlockedTimeView = {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
};

export type WeeklyAvailabilityInput = {
  weekday: number;
  startMinute: number;
  endMinute: number;
  slotMinutes?: number;
  active?: boolean;
};

/** Janelas ativas do dia — ou fallback 8–18 se o prestador ainda não configurou nada. */
export async function resolveWindowsForProviderDay(input: {
  tenantId: string;
  providerId: string;
  weekday: number;
}): Promise<{ windows: AvailabilityWindow[]; usingDefault: boolean }> {
  const prisma = await getPrisma();
  if (!prisma.providerAvailability?.findMany) {
    return { windows: defaultAvailabilityWindows(), usingDefault: true };
  }

  const anyConfigured = await prisma.providerAvailability.count({
    where: { tenantId: input.tenantId, providerId: input.providerId },
  });

  if (anyConfigured === 0) {
    return { windows: defaultAvailabilityWindows(), usingDefault: true };
  }

  const rows = await prisma.providerAvailability.findMany({
    where: {
      tenantId: input.tenantId,
      providerId: input.providerId,
      weekday: input.weekday,
      active: true,
    },
    orderBy: { startMinute: "asc" },
  });

  const windows = rows
    .map((r) => ({
      startMinute: r.startMinute,
      endMinute: r.endMinute,
      slotMinutes: r.slotMinutes,
    }))
    .filter(isValidWindow);

  return { windows, usingDefault: false };
}

export async function listWeeklyAvailability(input: {
  tenantId: string;
  providerId: string;
}): Promise<{
  windows: WeeklyAvailabilityRow[];
  usingDefault: boolean;
  defaults: WeeklyAvailabilityRow[];
}> {
  const prisma = await getPrisma();
  const rows = await prisma.providerAvailability.findMany({
    where: { tenantId: input.tenantId, providerId: input.providerId },
    orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
  });

  const defaults = [1, 2, 3, 4, 5].flatMap((weekday) =>
    defaultAvailabilityWindows().map((w) => ({
      weekday,
      startMinute: w.startMinute,
      endMinute: w.endMinute,
      slotMinutes: w.slotMinutes,
      active: true,
      startLabel: minutesToLabel(w.startMinute),
      endLabel: minutesToLabel(w.endMinute),
      weekdayLabel: WEEKDAY_LABELS_PT[weekday]!,
    })),
  );

  return {
    usingDefault: rows.length === 0,
    defaults,
    windows: rows.map((r) => ({
      weekday: r.weekday,
      startMinute: r.startMinute,
      endMinute: r.endMinute,
      slotMinutes: r.slotMinutes,
      active: r.active,
      startLabel: minutesToLabel(r.startMinute),
      endLabel: minutesToLabel(r.endMinute),
      weekdayLabel: WEEKDAY_LABELS_PT[r.weekday] ?? `Dia ${r.weekday}`,
    })),
  };
}

/** Substitui a grade semanal completa do prestador. */
export async function replaceWeeklyAvailability(input: {
  tenantId: string;
  providerId: string;
  windows: WeeklyAvailabilityInput[];
}): Promise<{ count: number } | { error: string }> {
  const prisma = await getPrisma();

  const provider = await prisma.user.findFirst({
    where: { id: input.providerId, tenantId: input.tenantId, role: "PRESTADOR" },
    select: { id: true },
  });
  if (!provider) return { error: "Prestador não encontrado" };

  const cleaned: WeeklyAvailabilityInput[] = [];
  for (const w of input.windows) {
    if (!Number.isInteger(w.weekday) || w.weekday < 0 || w.weekday > 6) {
      return { error: "Dia da semana inválido" };
    }
    const slotMinutes = w.slotMinutes ?? 30;
    const window = {
      startMinute: w.startMinute,
      endMinute: w.endMinute,
      slotMinutes,
    };
    if (!isValidWindow(window)) {
      return { error: `Janela inválida em ${WEEKDAY_LABELS_PT[w.weekday] ?? w.weekday}` };
    }
    cleaned.push({
      weekday: w.weekday,
      startMinute: w.startMinute,
      endMinute: w.endMinute,
      slotMinutes,
      active: w.active !== false,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.providerAvailability.deleteMany({
      where: { tenantId: input.tenantId, providerId: input.providerId },
    });
    if (cleaned.length > 0) {
      await tx.providerAvailability.createMany({
        data: cleaned.map((w) => ({
          tenantId: input.tenantId,
          providerId: input.providerId,
          weekday: w.weekday,
          startMinute: w.startMinute,
          endMinute: w.endMinute,
          slotMinutes: w.slotMinutes ?? 30,
          active: w.active !== false,
        })),
      });
    }
  });

  return { count: cleaned.length };
}

export async function listBlockedTimes(input: {
  tenantId: string;
  providerId: string;
  from?: Date;
  to?: Date;
}): Promise<BlockedTimeView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.providerBlockedTime.findMany({
    where: {
      tenantId: input.tenantId,
      providerId: input.providerId,
      ...(input.from || input.to
        ? {
            startsAt: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    },
    orderBy: { startsAt: "asc" },
    take: 100,
  });

  return rows.map((r) => ({
    id: r.id,
    startsAt: r.startsAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
    reason: r.reason,
  }));
}

export async function createBlockedTime(input: {
  tenantId: string;
  providerId: string;
  startsAt: Date;
  endsAt: Date;
  reason?: string | null;
}): Promise<BlockedTimeView | { error: string }> {
  if (!(input.endsAt.getTime() > input.startsAt.getTime())) {
    return { error: "Intervalo inválido: fim deve ser após o início" };
  }

  const prisma = await getPrisma();
  const provider = await prisma.user.findFirst({
    where: { id: input.providerId, tenantId: input.tenantId, role: "PRESTADOR" },
    select: { id: true },
  });
  if (!provider) return { error: "Prestador não encontrado" };

  const row = await prisma.providerBlockedTime.create({
    data: {
      tenantId: input.tenantId,
      providerId: input.providerId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      reason: input.reason?.trim() || null,
    },
  });

  return {
    id: row.id,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    reason: row.reason,
  };
}

export async function deleteBlockedTime(input: {
  tenantId: string;
  providerId: string;
  blockId: string;
}): Promise<boolean> {
  const prisma = await getPrisma();
  const existing = await prisma.providerBlockedTime.findFirst({
    where: {
      id: input.blockId,
      tenantId: input.tenantId,
      providerId: input.providerId,
    },
  });
  if (!existing) return false;
  await prisma.providerBlockedTime.delete({ where: { id: existing.id } });
  return true;
}

export async function loadBlocksForDay(input: {
  tenantId: string;
  providerId: string;
  dayStart: Date;
  dayEnd: Date;
}): Promise<{ startsAtMs: number; endsAtMs: number }[]> {
  const prisma = await getPrisma();
  if (!prisma.providerBlockedTime?.findMany) return [];

  const rows = await prisma.providerBlockedTime.findMany({
    where: {
      tenantId: input.tenantId,
      providerId: input.providerId,
      startsAt: { lt: input.dayEnd },
      endsAt: { gt: input.dayStart },
    },
    select: { startsAt: true, endsAt: true },
  });

  return rows.map((r) => ({
    startsAtMs: r.startsAt.getTime(),
    endsAtMs: r.endsAt.getTime(),
  }));
}
