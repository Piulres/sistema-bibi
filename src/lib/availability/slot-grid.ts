/**
 * Geração pura de slots a partir de janelas (minutos do dia) e bloqueios.
 * weekday/JS: 0=Dom … 6=Sáb.
 *
 * Os instantes são calculados no fuso da clínica via `toUtc(year,month,day,hour,minute)`.
 */

export const DEFAULT_SLOT_MINUTES = 30;
export const DEFAULT_START_MINUTE = 8 * 60;
export const DEFAULT_END_MINUTE = 18 * 60;

export type AvailabilityWindow = {
  startMinute: number;
  endMinute: number;
  slotMinutes: number;
};

export type TimeRangeMs = {
  startsAtMs: number;
  endsAtMs: number;
};

export type GeneratedSlot = {
  start: Date;
  startMs: number;
};

export type CivilDateParts = {
  year: number;
  month: number;
  day: number;
};

/** Fallback POC: todos os dias, 08:00–18:00 / 30 min. */
export function defaultAvailabilityWindows(): AvailabilityWindow[] {
  return [
    {
      startMinute: DEFAULT_START_MINUTE,
      endMinute: DEFAULT_END_MINUTE,
      slotMinutes: DEFAULT_SLOT_MINUTES,
    },
  ];
}

export function minutesToLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function isValidWindow(window: AvailabilityWindow): boolean {
  return (
    window.startMinute >= 0 &&
    window.endMinute <= 24 * 60 &&
    window.startMinute < window.endMinute &&
    window.slotMinutes >= 5 &&
    window.slotMinutes <= 240
  );
}

function overlapsBlock(slotStartMs: number, slotEndMs: number, blocks: TimeRangeMs[]): boolean {
  return blocks.some(
    (b) => slotStartMs < b.endsAtMs && slotEndMs > b.startsAtMs,
  );
}

/**
 * Gera inícios de slot no dia civil informado.
 * `toUtc` converte componentes civis → instante UTC (ex.: America/Sao_Paulo).
 */
export function generateDaySlots(input: {
  date: CivilDateParts;
  windows: AvailabilityWindow[];
  toUtc: (parts: CivilDateParts & { hour: number; minute: number }) => Date;
  blocks?: TimeRangeMs[];
  bookedStartMs?: Iterable<number>;
  nowMs?: number;
}): GeneratedSlot[] {
  const nowMs = input.nowMs ?? Date.now();
  const booked = new Set(input.bookedStartMs ?? []);
  const blocks = input.blocks ?? [];
  const slots: GeneratedSlot[] = [];

  for (const window of input.windows) {
    if (!isValidWindow(window)) continue;
    const step = window.slotMinutes;
    for (
      let minute = window.startMinute;
      minute + step <= window.endMinute;
      minute += step
    ) {
      const hour = Math.floor(minute / 60);
      const min = minute % 60;
      const slot = input.toUtc({
        year: input.date.year,
        month: input.date.month,
        day: input.date.day,
        hour,
        minute: min,
      });
      const startMs = slot.getTime();
      const endMs = startMs + step * 60_000;
      if (startMs < nowMs) continue;
      if (booked.has(startMs)) continue;
      if (overlapsBlock(startMs, endMs, blocks)) continue;
      slots.push({ start: slot, startMs });
    }
  }

  slots.sort((a, b) => a.startMs - b.startMs);
  return slots;
}

export const WEEKDAY_LABELS_PT = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;
