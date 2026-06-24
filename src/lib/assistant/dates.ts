import "server-only";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Interpreta YYYY-MM-DD ou palavras relativas (hoje, ontem, amanhã). */
export function parseAssistantDate(input: string | undefined, now = new Date()): Date {
  const normalized = input?.trim().toLowerCase() ?? "hoje";

  if (ISO_DATE.test(normalized)) {
    return new Date(`${normalized}T12:00:00`);
  }

  const base = new Date(now);
  base.setHours(12, 0, 0, 0);

  if (normalized === "hoje" || normalized === "today") return base;
  if (normalized === "ontem" || normalized === "yesterday") {
    base.setDate(base.getDate() - 1);
    return base;
  }
  if (normalized === "amanhã" || normalized === "amanha" || normalized === "tomorrow") {
    base.setDate(base.getDate() + 1);
    return base;
  }

  const brMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]) - 1;
    const year = brMatch[3]
      ? Number(brMatch[3].length === 2 ? `20${brMatch[3]}` : brMatch[3])
      : now.getFullYear();
    return new Date(year, month, day, 12, 0, 0, 0);
  }

  return base;
}

export function dayRange(date: Date): { from: Date; to: Date } {
  const from = new Date(date);
  from.setHours(0, 0, 0, 0);
  const to = new Date(date);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
