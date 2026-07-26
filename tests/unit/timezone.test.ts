import { describe, expect, it } from "vitest";
import {
  APP_TIMEZONE,
  civilDateISO,
  civilTimeHM,
  dayRangeInAppTz,
  endOfDayInAppTz,
  formatDateTimeBR,
  formatTimeBR,
  parseAppDateTime,
  shiftCivilDate,
  startOfDayInAppTz,
  zonedDateTimeToUtc,
} from "@/lib/timezone";

describe("timezone (America/Sao_Paulo)", () => {
  it("expõe o fuso operacional da plataforma", () => {
    expect(APP_TIMEZONE).toBe("America/Sao_Paulo");
  });

  it("converte data/hora civil BRT para UTC", () => {
    const utc = parseAppDateTime("2026-07-26", "09:00");
    expect(utc.toISOString()).toBe("2026-07-26T12:00:00.000Z");
  });

  it("formata labels em BRT mesmo com processo em UTC", () => {
    const instant = new Date("2026-07-26T12:00:00.000Z");
    expect(formatTimeBR(instant)).toMatch(/09:00/);
    expect(formatDateTimeBR(instant)).toContain("26/07/2026");
    expect(formatDateTimeBR(instant)).toMatch(/09:00/);
  });

  it("calcula limites do dia civil em BRT", () => {
    const { from, to, dateISO } = dayRangeInAppTz("2026-07-26");
    expect(dateISO).toBe("2026-07-26");
    expect(from.toISOString()).toBe("2026-07-26T03:00:00.000Z");
    expect(to.toISOString()).toBe("2026-07-27T02:59:59.999Z");
    expect(startOfDayInAppTz("2026-07-26").toISOString()).toBe(from.toISOString());
    expect(endOfDayInAppTz("2026-07-26").toISOString()).toBe(to.toISOString());
  });

  it("inclui agendamento 23:30 BRT no dia correto e exclui 00:30 BRT do dia seguinte", () => {
    const late = parseAppDateTime("2026-07-26", "23:30");
    const nextEarly = parseAppDateTime("2026-07-27", "00:30");
    const { from, to } = dayRangeInAppTz("2026-07-26");
    expect(late.getTime()).toBeGreaterThanOrEqual(from.getTime());
    expect(late.getTime()).toBeLessThanOrEqual(to.getTime());
    expect(nextEarly.getTime()).toBeGreaterThan(to.getTime());
  });

  it("deriva data civil BRT a partir de instante UTC", () => {
    // 2026-07-26 02:00 UTC = 2026-07-25 23:00 BRT
    expect(civilDateISO(new Date("2026-07-26T02:00:00.000Z"))).toBe("2026-07-25");
    expect(civilTimeHM(new Date("2026-07-26T02:00:00.000Z"))).toBe("23:00");
  });

  it("desloca dias civis sem depender do fuso do host", () => {
    expect(shiftCivilDate("2026-07-26", 1)).toBe("2026-07-27");
    expect(shiftCivilDate("2026-07-01", -1)).toBe("2026-06-30");
  });

  it("zonedDateTimeToUtc alinha meio-dia BRT", () => {
    const noon = zonedDateTimeToUtc({
      year: 2026,
      month: 7,
      day: 26,
      hour: 12,
    });
    expect(noon.toISOString()).toBe("2026-07-26T15:00:00.000Z");
  });
});
