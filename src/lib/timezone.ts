/**
 * Fuso operacional do Sistema Bibi - ServiceOS.
 * Netlify/Node rodam em UTC; agenda e labels devem ser America/Sao_Paulo.
 */
export const APP_TIMEZONE = "America/Sao_Paulo";
export const APP_LOCALE = "pt-BR";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIME = /^\d{2}:\d{2}(?::\d{2})?$/;

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function partsInTimeZone(date: Date, timeZone = APP_TIMEZONE): DateParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  // Intl pode retornar hour "24" em alguns motores para meia-noite.
  const hourRaw = Number(map.hour);
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: hourRaw === 24 ? 0 : hourRaw,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/** Offset (ms) de `timeZone` relativo a UTC no instante `date`. */
function timeZoneOffsetMs(date: Date, timeZone = APP_TIMEZONE): number {
  const p = partsInTimeZone(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - date.getTime();
}

/**
 * Interpreta componentes de data/hora civis no fuso da app e devolve o instante UTC.
 * Duas passagens cobrem bordas de DST (Brasil sem DST desde 2019, mas o algoritmo é genérico).
 * Milissegundos são aplicados após a correção de offset (Intl só resolve até segundos).
 */
export function zonedDateTimeToUtc(input: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
}): Date {
  const hour = input.hour ?? 0;
  const minute = input.minute ?? 0;
  const second = input.second ?? 0;
  const millisecond = input.millisecond ?? 0;
  const utcGuess = new Date(
    Date.UTC(input.year, input.month - 1, input.day, hour, minute, second, 0),
  );
  const offset1 = timeZoneOffsetMs(utcGuess);
  const corrected = new Date(utcGuess.getTime() - offset1);
  const offset2 = timeZoneOffsetMs(corrected);
  return new Date(utcGuess.getTime() - offset2 + millisecond);
}

/** Data civil YYYY-MM-DD no fuso da app. */
export function civilDateISO(date: Date = new Date()): string {
  const p = partsInTimeZone(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Horário HH:mm no fuso da app. */
export function civilTimeHM(date: Date = new Date()): string {
  const p = partsInTimeZone(date);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** Interpreta YYYY-MM-DD + HH:mm[:ss] como horário local da clínica (BRT). */
export function parseAppDateTime(dateISO: string, timeHM: string): Date {
  if (!ISO_DATE.test(dateISO)) {
    throw new Error(`Data inválida: ${dateISO}`);
  }
  if (!ISO_TIME.test(timeHM)) {
    throw new Error(`Horário inválido: ${timeHM}`);
  }
  const [year, month, day] = dateISO.split("-").map(Number);
  const [hour, minute, second = 0] = timeHM.split(":").map(Number);
  return zonedDateTimeToUtc({ year, month, day, hour, minute, second });
}

/** Início do dia civil (00:00:00.000) no fuso da app, como Date UTC. */
export function startOfDayInAppTz(date: Date | string = new Date()): Date {
  const iso = typeof date === "string" ? date : civilDateISO(date);
  if (!ISO_DATE.test(iso)) {
    throw new Error(`Data inválida: ${iso}`);
  }
  const [year, month, day] = iso.split("-").map(Number);
  return zonedDateTimeToUtc({ year, month, day, hour: 0, minute: 0, second: 0, millisecond: 0 });
}

/** Fim do dia civil (último ms antes da meia-noite seguinte) no fuso da app. */
export function endOfDayInAppTz(date: Date | string = new Date()): Date {
  const iso = typeof date === "string" ? date : civilDateISO(date);
  if (!ISO_DATE.test(iso)) {
    throw new Error(`Data inválida: ${iso}`);
  }
  const [year, month, day] = iso.split("-").map(Number);
  // Dia seguinte via calendário UTC dos componentes civis (não do instante).
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const nextStart = zonedDateTimeToUtc({
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  return new Date(nextStart.getTime() - 1);
}

export function dayRangeInAppTz(date: Date | string = new Date()): {
  from: Date;
  to: Date;
  dateISO: string;
} {
  const dateISO = typeof date === "string" ? date : civilDateISO(date);
  return {
    from: startOfDayInAppTz(dateISO),
    to: endOfDayInAppTz(dateISO),
    dateISO,
  };
}

/** Soma dias civis preservando o calendário no fuso da app. */
export function shiftCivilDate(dateISO: string, days: number): string {
  const start = startOfDayInAppTz(dateISO);
  const shifted = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  // Meio-dia no fuso evita ambiguidade em bordas; usamos o próprio instante +12h.
  const noon = new Date(shifted.getTime() + 12 * 60 * 60 * 1000);
  return civilDateISO(noon);
}

function compactOptions(
  defaults: Intl.DateTimeFormatOptions,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions {
  const merged: Intl.DateTimeFormatOptions = { ...defaults, ...options };
  for (const key of Object.keys(merged) as (keyof Intl.DateTimeFormatOptions)[]) {
    if (merged[key] === undefined) {
      delete merged[key];
    }
  }
  return merged;
}

export function formatDateTimeBR(
  value: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return value.toLocaleString(
    APP_LOCALE,
    compactOptions(
      {
        timeZone: APP_TIMEZONE,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
      options,
    ),
  );
}

export function formatDateBR(
  value: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return value.toLocaleDateString(
    APP_LOCALE,
    compactOptions(
      {
        timeZone: APP_TIMEZONE,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
      options,
    ),
  );
}

export function formatTimeBR(
  value: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return value.toLocaleTimeString(
    APP_LOCALE,
    compactOptions(
      {
        timeZone: APP_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
      },
      options,
    ),
  );
}
