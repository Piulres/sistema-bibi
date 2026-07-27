import { describe, expect, it } from "vitest";
import {
  collectAllowedToolNames,
  mergeArgsPreferGateway,
  refineHybridPlan,
} from "@/lib/assistant/provider/hybrid";
import { buildAssistantSystemPrompt } from "@/lib/assistant/context";
import type { SessionUser } from "@/lib/session";

const baseUser = {
  id: "u1",
  role: "INTERNO",
  tenantId: "t1",
  tenantName: "Clínica Demo",
  niche: "MEDICAL",
  labels: {
    patient: "Paciente",
    provider: "Prestador",
    appointment: "Consulta",
    procedure: "Procedimento",
    beneficiary: "Beneficiário",
  },
  internoPermissions: ["agenda", "billing"],
  internoProfile: "ADMIN",
} as unknown as SessionUser;

describe("assistant hybrid pipeline (Fase 4) — LLM valida via regras antes das tools", () => {
  it("allowlist com regras ligadas é a interseção regras × RBAC", () => {
    const allowed = collectAllowedToolNames({
      availableToolNames: ["count_appointments", "list_debtors", "secret_admin_tool"],
      ruleToolNames: ["count_appointments", "list_debtors", "ghost_tool"],
      rulesEnabled: true,
    });
    expect([...allowed].sort()).toEqual(["count_appointments", "list_debtors"]);
  });

  it("com regras desligadas o allowlist é só RBAC — IA não usa oráculo de regras", () => {
    const allowed = collectAllowedToolNames({
      availableToolNames: ["count_appointments", "list_debtors"],
      ruleToolNames: ["count_appointments"],
      rulesEnabled: false,
    });
    expect(allowed.has("list_debtors")).toBe(true);
  });

  it("descarta tool calls do gateway fora do allowlist e mescla args com regras", () => {
    const plan = refineHybridPlan({
      gatewayPlan: {
        toolCalls: [
          { name: "count_appointments", arguments: { date: "" } },
          { name: "drop_database", arguments: {} },
        ],
      },
      rulesPlan: {
        toolCalls: [{ name: "count_appointments", arguments: { date: "today" } }],
      },
      allowedToolNames: new Set(["count_appointments"]),
      rulesEnabled: true,
    });

    expect(plan.source).toBe("hybrid");
    expect(plan.rejectedTools).toEqual(["drop_database"]);
    expect(plan.toolCalls).toHaveLength(1);
    expect(plan.toolCalls[0]?.arguments.date).toBe("today");
  });

  it("quando o gateway não propõe tool válida, usa o plano de regras", () => {
    const plan = refineHybridPlan({
      gatewayPlan: {
        toolCalls: [{ name: "invented_tool", arguments: {} }],
        fallback: "texto solto",
      },
      rulesPlan: {
        toolCalls: [{ name: "list_debtors", arguments: { limit: 15 } }],
      },
      allowedToolNames: new Set(["list_debtors", "count_appointments"]),
      rulesEnabled: true,
    });

    expect(plan.source).toBe("rules");
    expect(plan.toolCalls[0]?.name).toBe("list_debtors");
    expect(plan.rejectedTools).toContain("invented_tool");
  });

  it("sem tool válida devolve fallback textual — não executa nada", () => {
    const plan = refineHybridPlan({
      gatewayPlan: { toolCalls: [], fallback: "Posso ajudar com a agenda." },
      rulesPlan: { toolCalls: [] },
      allowedToolNames: new Set(["count_appointments"]),
      rulesEnabled: true,
    });
    expect(plan.source).toBe("fallback");
    expect(plan.toolCalls).toHaveLength(0);
    expect(plan.fallback).toMatch(/agenda/i);
  });

  it("mergeArgsPreferGateway preenche vazios com extração das regras", () => {
    expect(
      mergeArgsPreferGateway(
        { date: "", query: "joão" },
        { date: "2026-07-27", limit: 10 },
      ),
    ).toEqual({ date: "2026-07-27", query: "joão", limit: 10 });
  });

  it("system prompt em modo IA lista tools permitidas e menciona validação", () => {
    const prompt = buildAssistantSystemPrompt(baseUser, {
      mode: "ai",
      allowedToolNames: ["count_appointments", "list_debtors"],
      pageContext: "/interno/agenda",
    });
    expect(prompt).toMatch(/IA híbrida/i);
    expect(prompt).toContain("count_appointments");
    expect(prompt).toContain("list_debtors");
    expect(prompt).toContain("/interno/agenda");
  });
});
