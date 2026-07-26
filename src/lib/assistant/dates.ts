import "server-only";
import {
  APP_TIMEZONE,
  civilDateISO,
  dayRangeInAppTz,
  formatDateBR,
  shiftCivilDate,
  zonedDateTimeToUtc,
} from "@/lib/timezone";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Interpreta YYYY-MM-DD ou palavras relativas (hoje, ontem, amanhã) no fuso da app. */
export function parseAssistantDate(input: string | undefined, now = new Date()): Date {
  const normalized = input?.trim().toLowerCase() ?? "hoje";

  if (ISO_DATE.test(normalized)) {
    const [year, month, day] = normalized.split("-").map(Number);
    return zonedDateTimeToUtc({ year, month, day, hour: 12 });
  }

  const todayISO = civilDateISO(now);

  if (normalized === "hoje" || normalized === "today") {
    const [year, month, day] = todayISO.split("-").map(Number);
    return zonedDateTimeToUtc({ year, month, day, hour: 12 });
  }
  if (normalized === "ontem" || normalized === "yesterday") {
    const iso = shiftCivilDate(todayISO, -1);
    const [year, month, day] = iso.split("-").map(Number);
    return zonedDateTimeToUtc({ year, month, day, hour: 12 });
  }
  if (normalized === "amanhã" || normalized === "amanha" || normalized === "tomorrow") {
    const iso = shiftCivilDate(todayISO, 1);
    const [year, month, day] = iso.split("-").map(Number);
    return zonedDateTimeToUtc({ year, month, day, hour: 12 });
  }

  const brMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]);
    const year = brMatch[3]
      ? Number(brMatch[3].length === 2 ? `20${brMatch[3]}` : brMatch[3])
      : Number(todayISO.slice(0, 4));
    return zonedDateTimeToUtc({ year, month, day, hour: 12 });
  }

  const [year, month, day] = todayISO.split("-").map(Number);
  return zonedDateTimeToUtc({ year, month, day, hour: 12 });
}

export function dayRange(date: Date): { from: Date; to: Date } {
  const { from, to } = dayRangeInAppTz(date);
  return { from, to };
}

export function toIsoDate(date: Date): string {
  return civilDateISO(date);
}

export function formatDateLabel(date: Date): string {
  return formatDateBR(date);
}

export { APP_TIMEZONE };
