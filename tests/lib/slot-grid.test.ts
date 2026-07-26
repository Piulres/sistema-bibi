import { describe, expect, it } from "vitest";
import {
  defaultAvailabilityWindows,
  generateDaySlots,
  isValidWindow,
  parseTimeToMinutes,
} from "@/lib/availability/slot-grid";

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

  it("gera slots 30min 08–18 e exclui bloqueio/ocupado", () => {
    const dayStart = new Date("2026-08-03T00:00:00"); // segunda
    const noon = new Date(dayStart);
    noon.setHours(12, 0, 0, 0);

    const slots = generateDaySlots({
      dayStart,
      windows: defaultAvailabilityWindows(),
      nowMs: dayStart.getTime() - 1,
      bookedStartMs: [noon.getTime()],
      blocks: [
        {
          startsAtMs: new Date(dayStart).setHours(12, 0, 0, 0),
          endsAtMs: new Date(dayStart).setHours(13, 0, 0, 0),
        },
      ],
    });

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]!.start.getHours()).toBe(8);
    expect(slots.some((s) => s.start.getHours() === 12)).toBe(false);
    // 12:30 also overlaps 12–13 block
    expect(slots.some((s) => s.start.getHours() === 12 && s.start.getMinutes() === 30)).toBe(
      false,
    );
  });

  it("respeita duração de slot customizada", () => {
    const dayStart = new Date("2026-08-03T00:00:00");
    const slots = generateDaySlots({
      dayStart,
      windows: [{ startMinute: 9 * 60, endMinute: 11 * 60, slotMinutes: 60 }],
      nowMs: dayStart.getTime() - 1,
    });
    expect(slots).toHaveLength(2);
    expect(slots[0]!.start.getHours()).toBe(9);
    expect(slots[1]!.start.getHours()).toBe(10);
  });
});
