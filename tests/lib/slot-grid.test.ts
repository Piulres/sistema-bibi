import { describe, expect, it } from "vitest";
import {
  defaultAvailabilityWindows,
  generateDaySlots,
  isValidWindow,
  parseTimeToMinutes,
} from "@/lib/availability/slot-grid";
import { zonedDateTimeToUtc } from "@/lib/timezone";

const toUtc = ({
  year,
  month,
  day,
  hour,
  minute,
}: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}) => zonedDateTimeToUtc({ year, month, day, hour, minute });

describe("slot-grid", () => {
  it("parseia horários HH:mm", () => {
    expect(parseTimeToMinutes("08:00")).toBe(480);
    expect(parseTimeToMinutes("18:30")).toBe(1110);
    expect(parseTimeToMinutes("25:00")).toBeNull();
  });

  it("valida janelas", () => {
    expect(isValidWindow({ startMinute: 480, endMinute: 1080, slotMinutes: 30 })).toBe(true);
    expect(isValidWindow({ startMinute: 1080, endMinute: 480, slotMinutes: 30 })).toBe(false);
  });

  it("gera slots 30min 08–18 (BRT) e exclui bloqueio/ocupado", () => {
    const date = { year: 2026, month: 8, day: 3 }; // segunda
    const noon = zonedDateTimeToUtc({ ...date, hour: 12, minute: 0 });
    const blockStart = zonedDateTimeToUtc({ ...date, hour: 12, minute: 0 });
    const blockEnd = zonedDateTimeToUtc({ ...date, hour: 13, minute: 0 });

    const slots = generateDaySlots({
      date,
      windows: defaultAvailabilityWindows(),
      toUtc,
      nowMs: zonedDateTimeToUtc({ ...date, hour: 0, minute: 0 }).getTime() - 1,
      bookedStartMs: [noon.getTime()],
      blocks: [{ startsAtMs: blockStart.getTime(), endsAtMs: blockEnd.getTime() }],
    });

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]!.start.toISOString()).toBe(
      zonedDateTimeToUtc({ ...date, hour: 8, minute: 0 }).toISOString(),
    );
    expect(slots.some((s) => s.startMs === noon.getTime())).toBe(false);
    const twelveThirty = zonedDateTimeToUtc({ ...date, hour: 12, minute: 30 }).getTime();
    expect(slots.some((s) => s.startMs === twelveThirty)).toBe(false);
  });

  it("respeita duração de slot customizada", () => {
    const date = { year: 2026, month: 8, day: 3 };
    const slots = generateDaySlots({
      date,
      windows: [{ startMinute: 9 * 60, endMinute: 11 * 60, slotMinutes: 60 }],
      toUtc,
      nowMs: zonedDateTimeToUtc({ ...date, hour: 0, minute: 0 }).getTime() - 1,
    });
    expect(slots).toHaveLength(2);
    expect(slots[0]!.start.toISOString()).toBe(
      zonedDateTimeToUtc({ ...date, hour: 9, minute: 0 }).toISOString(),
    );
    expect(slots[1]!.start.toISOString()).toBe(
      zonedDateTimeToUtc({ ...date, hour: 10, minute: 0 }).toISOString(),
    );
  });
});
