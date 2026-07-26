/**
 * Geração ICS (RFC 5545) — lógica pura, sem I/O.
 * Usado por feeds assináveis e download pontual de um evento.
 */

export const APPOINTMENT_SLOT_MINUTES = 30;

export type IcsEventStatus = "CONFIRMED" | "TENTATIVE" | "CANCELLED";

export type IcsEventInput = {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  status?: IcsEventStatus;
  url?: string;
  /** Stamp de criação/atualização (UTC). */
  dtStamp?: Date;
};

export type IcsCalendarInput = {
  productId?: string;
  calendarName: string;
  events: IcsEventInput[];
};

/** Escapa texto ICS (vírgula, ponto-e-vírgula, barra, quebra de linha). */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Formata Date como UTC compacto: YYYYMMDDTHHMMSSZ */
export function formatIcsUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const s = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}${mo}${d}T${h}${mi}${s}Z`;
}

/** Dobra linhas longas (máx. 75 octetos) conforme RFC 5545. */
export function foldIcsLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let remaining = line;
  parts.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    parts.push(` ${remaining.slice(0, 74)}`);
    remaining = remaining.slice(74);
  }
  return parts.join("\r\n");
}

function eventLines(event: IcsEventInput): string[] {
  const stamp = event.dtStamp ?? new Date();
  const lines = [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${formatIcsUtc(stamp)}`,
    `DTSTART:${formatIcsUtc(event.start)}`,
    `DTEND:${formatIcsUtc(event.end)}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
    `STATUS:${event.status ?? "CONFIRMED"}`,
  ];
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  }
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }
  lines.push("END:VEVENT");
  return lines;
}

/** Monta um calendário VCALENDAR completo (CRLF). */
export function buildIcsCalendar(input: IcsCalendarInput): string {
  const productId = input.productId ?? "-//Sistema Bibi ServiceOS//Calendar//PT";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${productId}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(input.calendarName)}`,
    ...input.events.flatMap(eventLines),
    "END:VCALENDAR",
  ];
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

export function appointmentEndAt(
  start: Date,
  durationMinutes = APPOINTMENT_SLOT_MINUTES,
): Date {
  return new Date(start.getTime() + durationMinutes * 60_000);
}
