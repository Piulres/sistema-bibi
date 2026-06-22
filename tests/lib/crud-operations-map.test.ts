import { describe, expect, it } from "vitest";
import {
  CRUD_OPERATIONS_MAP,
  crudMapStats,
  filterCrudMapByPortal,
} from "@/lib/crud-operations-map";

describe("crud-operations-map", () => {
  it("lista entidades de todos os portais principais", () => {
    const portals = new Set(CRUD_OPERATIONS_MAP.map((r) => r.portal));
    expect(portals.has("Interno")).toBe(true);
    expect(portals.has("Prestador")).toBe(true);
    expect(portals.has("Beneficiário")).toBe(true);
    expect(portals.has("PJ")).toBe(true);
  });

  it("inclui entidades críticas do mapeamento estendido", () => {
    const names = CRUD_OPERATIONS_MAP.map((r) => r.entity);
    expect(names).toContain("Prontuário (PEP)");
    expect(names).toContain("Pagamento PIX");
    expect(names).toContain("MFA (TOTP)");
    expect(names).toContain("Lembretes automáticos");
    expect(names).toContain("Entrega de webhook");
  });

  it("filtra por portal", () => {
    const prestador = filterCrudMapByPortal("Prestador");
    expect(prestador.length).toBeGreaterThan(0);
    expect(prestador.every((r) => r.portal === "Prestador")).toBe(true);
  });

  it("expõe estatísticas coerentes", () => {
    const stats = crudMapStats();
    expect(stats.entities).toBe(CRUD_OPERATIONS_MAP.length);
    expect(stats.entities).toBeGreaterThanOrEqual(25);
    expect(stats.uiOperations).toBeGreaterThan(50);
  });
});
