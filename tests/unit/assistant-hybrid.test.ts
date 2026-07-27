import { describe, expect, it } from "vitest";
import {
  allowedToolsAfterOverrides,
  filterToolsForOverrides,
  refineGatewayPlan,
} from "@/lib/assistant/hybrid";
import { planMockFromIntents, clearMockContext } from "@/lib/assistant/provider/mock-match";
import { parseTenantRuleOverrides } from "@/lib/assistant/rules/tenant-overrides";
import type { AssistantToolDefinition } from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";
import { NICHE_MASTER_LABELS } from "@/constants/niches";
import { CLINIC_BRANDING_DEFAULTS } from "@/lib/theme/tokens";

const admin = (): SessionUser =>
  ({
    id: "u-hybrid",
    name: "Admin Híbrido",
    email: "admin@bibi.health",
    role: "INTERNO",
    tenantId: "t1",
    tenantSlug: "horizonte",
    companyId: null,
    patientId: null,
    tenantName: "Horizonte",
    companyName: null,
    patientName: null,
    internoProfile: "ADMIN",
    internoPermissions: ["dashboard", "agenda", "billing", "cadastros", "assistente"],
    branding: CLINIC_BRANDING_DEFAULTS,
    niche: "MEDICAL",
    labels: NICHE_MASTER_LABELS.MEDICAL,
  }) as SessionUser;

const stubTools = (...names: string[]): AssistantToolDefinition[] =>
  names.map((name) => ({
    name,
    description: name,
    parameters: { type: "object", properties: {} },
    handler: async () => ({}),
  }));

describe("assistant hybrid — Fase 4 (LLM → regras → tools)", () => {
  it("allowedToolsAfterOverrides remove tools desabilitadas pelo tenant — WHY defesa em profundidade no plano", () => {
    const overrides = parseTenantRuleOverrides([
      { tool: "list_debtors", disabled: true },
    ]);
    const allowed = allowedToolsAfterOverrides(
      ["count_appointments", "list_debtors", "get_revenue_summary"],
      overrides,
    );
    expect(allowed.has("count_appointments")).toBe(true);
    expect(allowed.has("list_debtors")).toBe(false);
    expect(filterToolsForOverrides(stubTools("list_debtors", "count_appointments"), overrides)).toHaveLength(
      1,
    );
  });

  it("refineGatewayPlan descarta tool calls fora do permitido e marca refined — WHY pipeline híbrido", () => {
    const allowed = new Set(["count_appointments"]);
    const { plan, dropped, refined } = refineGatewayPlan(
      {
        toolCalls: [
          { name: "count_appointments", arguments: { date: "2026-07-27" } },
          { name: "list_debtors", arguments: {} },
          { name: "unknown_tool", arguments: {} },
        ],
      },
      allowed,
    );
    expect(refined).toBe(true);
    expect(dropped).toEqual(["list_debtors", "unknown_tool"]);
    expect(plan.toolCalls).toHaveLength(1);
    expect(plan.toolCalls[0]?.name).toBe("count_appointments");
  });

  it("refineGatewayPlan esvazia plano quando só restam tools bloqueadas — WHY fallback para regras", () => {
    const { plan, refined } = refineGatewayPlan(
      { toolCalls: [{ name: "list_debtors", arguments: {} }] },
      new Set(["count_appointments"]),
    );
    expect(refined).toBe(true);
    expect(plan.toolCalls).toHaveLength(0);
    expect(plan.fallback).toMatch(/ferramentas permitidas/i);
  });

  it("runtime mock honra ruleOverrides disabled — WHY CRUD Fase 3 afeta chat real", () => {
    clearMockContext("u-hybrid");
    const overrides = parseTenantRuleOverrides([
      { tool: "count_appointments", disabled: true },
    ]);
    const tools = new Set(["count_appointments", "get_dashboard_kpis"]);
    const blocked = planMockFromIntents(
      "quantos agendamentos hoje?",
      admin(),
      tools,
      overrides,
    );
    expect(blocked.toolCalls.some((c) => c.name === "count_appointments")).toBe(false);

    const open = planMockFromIntents(
      "quantos agendamentos hoje?",
      admin(),
      tools,
      undefined,
    );
    expect(open.toolCalls.some((c) => c.name === "count_appointments")).toBe(true);
  });

  it("runtime mock honra addTriggers do tenant — WHY override custom dispara tool", () => {
    clearMockContext("u-hybrid");
    const overrides = parseTenantRuleOverrides([
      { tool: "list_debtors", addTriggers: ["quem esta devendo custom"] },
    ]);
    const plan = planMockFromIntents(
      "quem esta devendo custom",
      admin(),
      new Set(["list_debtors", "count_appointments"]),
      overrides,
    );
    expect(plan.toolCalls.some((c) => c.name === "list_debtors")).toBe(true);
  });
});
