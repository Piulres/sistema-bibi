import { describe, expect, it } from "vitest";
import { ASSISTANT_SCENARIOS, scenarioCount } from "@/lib/assistant/scenarios";
import {
  ASSISTANT_TOOL_INVENTORY,
  buildRoutineMatrix,
  inventoryByPortal,
} from "@/lib/assistant/inventory";
import { NICHE_IDS } from "@/lib/niche/types";
import { hasInternoPermission } from "@/lib/interno-permissions";

describe("matriz de rotina — inventário", () => {
  it("cobre os 4 portais no inventário de tools", () => {
    expect(inventoryByPortal("INTERNO").length).toBeGreaterThan(5);
    expect(inventoryByPortal("PRESTADOR").length).toBeGreaterThan(2);
    expect(inventoryByPortal("PJ").length).toBeGreaterThan(2);
    expect(inventoryByPortal("BENEFICIARIO").length).toBeGreaterThan(3);
    expect(inventoryByPortal("SHARED").some((t) => t.name === "explain_capability")).toBe(true);
  });

  it("tools de nicho VET identificadas", () => {
    const vetOnly = ASSISTANT_TOOL_INVENTORY.filter(
      (t) => Array.isArray(t.niches) && t.niches.includes("VET"),
    );
    expect(vetOnly.some((t) => t.name === "search_pets")).toBe(true);
  });
});

describe("matriz de rotina — cenários × nichos", () => {
  const matrix = buildRoutineMatrix(ASSISTANT_SCENARIOS);

  it("cenários >= 70 após expansão de nichos", () => {
    expect(scenarioCount()).toBeGreaterThanOrEqual(70);
  });

  it("INTERNO MEDICAL tem cobertura base", () => {
    const cell = matrix.find((c) => c.portal === "INTERNO" && c.niche === "MEDICAL");
    expect(cell?.scenarioIds.length).toBeGreaterThan(15);
  });

  it("cada nicho tem ao menos um cenário (explícito ou default MEDICAL)", () => {
    for (const niche of NICHE_IDS) {
      const nicheScenarios = ASSISTANT_SCENARIOS.filter(
        (s) => s.niche === niche || (!s.niche && niche === "MEDICAL"),
      );
      expect(nicheScenarios.length, `nicho ${niche}`).toBeGreaterThan(0);
    }
  });

  it("RBAC: módulo assistente só ADMIN", () => {
    expect(hasInternoPermission("INTERNO", "ADMIN", "assistente")).toBe(true);
    expect(hasInternoPermission("INTERNO", "FATURAMENTO", "assistente")).toBe(false);
    expect(hasInternoPermission("INTERNO", "RECEPCAO", "assistente")).toBe(false);
    expect(hasInternoPermission("INTERNO", "READONLY", "assistente")).toBe(false);
  });
});
