import { describe, expect, it } from "vitest";
import {
  FLOW_IMPROVEMENTS_MAP,
  countFlowByStatus,
  filterFlowImprovementsByPortal,
} from "@/lib/flow-improvements-map";

describe("flow-improvements-map", () => {
  it("contém melhorias implementadas e planejadas", () => {
    expect(FLOW_IMPROVEMENTS_MAP.length).toBeGreaterThan(5);
    const counts = countFlowByStatus(FLOW_IMPROVEMENTS_MAP);
    expect(counts.implemented).toBeGreaterThan(0);
    expect(counts.planned).toBeGreaterThan(0);
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
});
