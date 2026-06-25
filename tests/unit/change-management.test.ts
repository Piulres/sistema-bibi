import { describe, expect, it } from "vitest";
import {
  buildChangeMetadata,
  buildDeleteMetadata,
  metadataHasDiff,
  parseTimelineMetadata,
  serializeTimelineMetadata,
} from "@/lib/change-management";

describe("change-management metadata", () => {
  it("detecta campos alterados entre snapshots", () => {
    const meta = buildChangeMetadata(
      { name: "João", phone: "11999999999" },
      { name: "João Silva", phone: "11999999999" },
    );
    expect(meta.fieldsChanged).toEqual(["name"]);
    expect(meta.before?.name).toBe("João");
    expect(meta.after?.name).toBe("João Silva");
  });

  it("serializa e parseia metadata da timeline", () => {
    const meta = buildChangeMetadata({ status: "ATIVO" }, { status: "INATIVO" });
    const raw = serializeTimelineMetadata(meta);
    const parsed = parseTimelineMetadata(raw);
    expect(parsed?.fieldsChanged).toEqual(["status"]);
    expect(metadataHasDiff(parsed)).toBe(true);
  });

  it("metadata de delete guarda apenas before", () => {
    const meta = buildDeleteMetadata({ multiplier: 0.9, description: "Teste" });
    expect(meta.before?.multiplier).toBe(0.9);
    expect(meta.after).toBeUndefined();
    expect(metadataHasDiff(meta)).toBe(true);
  });

  it("parse inválido retorna null", () => {
    expect(parseTimelineMetadata("{invalid")).toBeNull();
    expect(metadataHasDiff(null)).toBe(false);
  });
});
