import { describe, expect, it } from "vitest";
import { resolveAssistantRules, countRuleTriggers, buildRulesPreview } from "@/lib/assistant/rules/resolve";
import { resolveAssistantIntents, buildRuleEngineStats } from "@/lib/assistant/rules/engine";
import { globalRuleTemplates } from "@/lib/assistant/rules/templates";
import { countMockTriggers } from "@/lib/assistant/provider/mock-intents";
import {
  normalizeTenantRuleOverrides,
  parseTenantRuleOverrides,
} from "@/lib/assistant/rules/tenant-overrides";
import type { SessionUser } from "@/lib/session";

const mockUser = (niche: SessionUser["niche"] = "MEDICAL"): SessionUser =>
  ({
    id: "u1",
    niche,
    role: "INTERNO",
    tenantId: "t1",
    labels: {} as SessionUser["labels"],
  }) as SessionUser;

describe("assistant rule engine", () => {
  it("preserva cobertura global de gatilhos no nicho MEDICAL", () => {
    const global = globalRuleTemplates();
    expect(global.length).toBeGreaterThan(20);
    const baseline = countMockTriggers();
    const medical = resolveAssistantRules({ niche: "MEDICAL" });
    expect(countRuleTriggers(medical)).toBe(baseline);
  });

  it("adiciona vocabulário VET sem perder regras globais", () => {
    const medical = countRuleTriggers(resolveAssistantRules({ niche: "MEDICAL" }));
    const vet = resolveAssistantRules({ niche: "VET" });
    expect(countRuleTriggers(vet)).toBeGreaterThan(medical);
    const intents = resolveAssistantIntents(mockUser("VET"));
    const petRule = intents.find((i) => i.tool === "count_appointments");
    expect(petRule?.triggers.some((t) => /pet|tutor|banho/i.test(t))).toBe(true);
  });

  it("honra override tenant desabilitando tool", () => {
    const overrides = parseTenantRuleOverrides([
      { tool: "count_appointments", disabled: true },
    ]);
    const rules = resolveAssistantRules({ niche: "MEDICAL", tenantOverrides: overrides });
    expect(rules.some((r) => r.tool === "count_appointments")).toBe(false);
  });

  it("honra override tenant adicionando gatilho", () => {
    const overrides = parseTenantRuleOverrides([
      { tool: "count_appointments", addTriggers: ["gatilho-custom-tenant"] },
    ]);
    const rules = resolveAssistantRules({ niche: "MEDICAL", tenantOverrides: overrides });
    const rule = rules.find((r) => r.tool === "count_appointments");
    expect(rule?.triggers.some((t) => t.includes("gatilho-custom-tenant"))).toBe(true);
    expect(rule?.source).toBe("tenant");
  });

  it("expõe estatísticas para painel interno", () => {
    const stats = buildRuleEngineStats("LEGAL");
    expect(stats.niche).toBe("LEGAL");
    expect(stats.globalRules).toBeGreaterThan(0);
    expect(stats.totalTriggers).toBeGreaterThan(countMockTriggers());
  });

  it("conta overrides do tenant pelo array persistido — não só rules com source tenant", () => {
    const overrides = parseTenantRuleOverrides([
      { tool: "count_appointments", disabled: true },
      { tool: "list_debtors", addTriggers: ["quem deve"] },
    ]);
    const stats = buildRuleEngineStats("MEDICAL", overrides);
    expect(stats.tenantOverrides).toBe(2);
  });

  it("preview inclui tools desabilitadas e gatilhos efetivos para CRUD Fase 3", () => {
    const overrides = parseTenantRuleOverrides([
      { tool: "count_appointments", addTriggers: ["agenda custom"] },
      { tool: "list_debtors", disabled: true },
    ]);
    const preview = buildRulesPreview({ niche: "MEDICAL", tenantOverrides: overrides });
    const count = preview.find((r) => r.tool === "count_appointments");
    expect(count?.source).toBe("tenant");
    expect(count?.triggers.some((t) => /agenda custom/i.test(t))).toBe(true);
    const debtors = preview.find((r) => r.tool === "list_debtors");
    expect(debtors?.disabled).toBe(true);
    expect(debtors?.triggers.length).toBeGreaterThan(0);
  });

  it("normaliza overrides vazios e parse deduplica por tool", () => {
    expect(
      normalizeTenantRuleOverrides([
        { tool: "count_appointments", addTriggers: ["A", "a"] },
        { tool: "noop", addTriggers: [] },
      ]),
    ).toEqual([{ tool: "count_appointments", addTriggers: ["A", "a"] }]);

    const parsed = parseTenantRuleOverrides([
      { tool: "count_appointments", addTriggers: ["A"] },
      { tool: "count_appointments", disabled: true },
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.disabled).toBe(true);
  });
});
