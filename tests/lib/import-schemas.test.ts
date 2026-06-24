import { describe, expect, it } from "vitest";
import { CRUD_OPERATIONS_MAP } from "@/lib/crud-operations-map";
import { IMPORT_ENTITIES, IMPORT_ENTITY_SCHEMAS } from "@/lib/imports/schemas";

describe("imports.schemas", () => {
  it("define schemas para todas as entidades de importação", () => {
    for (const entity of IMPORT_ENTITIES) {
      const schema = IMPORT_ENTITY_SCHEMAS[entity];
      expect(schema.entity).toBe(entity);
      expect(schema.fields.some((field) => field.required)).toBe(true);
      expect(schema.fields.every((field) => field.key && field.header)).toBe(true);
    }
  });

  it("mapeia operações de importação no CRUD map", () => {
    const labels = CRUD_OPERATIONS_MAP.flatMap((entry) =>
      entry.create.map((operation) => operation.label),
    );
    expect(labels.some((label) => label.includes("Importar lote JSON/CSV"))).toBe(true);
  });
});
