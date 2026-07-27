import { describe, expect, it } from "vitest";
import {
  FLOW_IMPROVEMENTS_MAP,
  countFlowByStatus,
  filterFlowImprovementsByPortal,
} from "@/lib/flow-improvements-map";

describe("flow-improvements-map", () => {
  it("contém melhorias implementadas (backlog planned/partial quando existir)", () => {
    expect(FLOW_IMPROVEMENTS_MAP.length).toBeGreaterThan(5);
    const counts = countFlowByStatus(FLOW_IMPROVEMENTS_MAP);
    expect(counts.implemented).toBeGreaterThan(0);
    expect(counts.planned + counts.partial).toBeGreaterThanOrEqual(0);
  });

  it("filtra por portal", () => {
    const beneficiario = filterFlowImprovementsByPortal("Beneficiário");
    expect(beneficiario.every((i) => i.portal === "Beneficiário")).toBe(true);
    expect(beneficiario.some((i) => i.id === "benef-cancel-appointment")).toBe(true);
  });

  it("inclui cancelamento de consulta implementado", () => {
    const item = FLOW_IMPROVEMENTS_MAP.find((i) => i.id === "benef-cancel-appointment");
    expect(item?.status).toBe("implemented");
    expect(item?.api).toContain("PATCH");
  });

  it("marca pj-appointment-request como implementado após agendamento RH", () => {
    const item = FLOW_IMPROVEMENTS_MAP.find((i) => i.id === "pj-appointment-request");
    expect(item?.status).toBe("implemented");
    expect(item?.api).toContain("POST /api/pj/appointments");
  });

  it("marca interno-rbac-hardening como implementado após Fase 5 write guards — mapa acompanha inventário", () => {
    const item = FLOW_IMPROVEMENTS_MAP.find((i) => i.id === "interno-rbac-hardening");
    expect(item?.status).toBe("implemented");
    expect(item?.api).toMatch(/requireInternoModuleWrite/);
  });

  it("marca pj-beneficiary-crud como implementado — RH inclui/edita/desvincula colaboradores", () => {
    const item = FLOW_IMPROVEMENTS_MAP.find((i) => i.id === "pj-beneficiary-crud");
    expect(item?.status).toBe("implemented");
    expect(item?.api).toContain("/api/pj/beneficiaries");
  });
});
