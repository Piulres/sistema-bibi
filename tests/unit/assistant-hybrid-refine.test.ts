import { describe, expect, it } from "vitest";
import { refineAiPlan } from "@/lib/assistant/rules/refine";
import { parseTenantRuleOverrides } from "@/lib/assistant/rules/tenant-overrides";
import type { SessionUser } from "@/lib/session";

const mockUser = (overrides: Partial<SessionUser> = {}): SessionUser =>
  ({
    id: "u1",
    niche: "MEDICAL",
    role: "INTERNO",
    tenantId: "t1",
    labels: {} as SessionUser["labels"],
    ...overrides,
  }) as SessionUser;

describe("assistant hybrid refine (Fase 4)", () => {
  it("mantém tool calls permitidas pelo motor de regras", () => {
    const result = refineAiPlan({
      gatewayPlan: {
        toolCalls: [{ name: "count_appointments", arguments: { date: "today" } }],
      },
      user: mockUser(),
      allowedToolNames: new Set(["count_appointments", "get_dashboard_kpis"]),
    });
    expect(result.plan.toolCalls).toHaveLength(1);
    expect(result.filteredCount).toBe(0);
  });

  it("remove tools desabilitadas pelo tenant", () => {
    const overrides = parseTenantRuleOverrides([
      { tool: "count_appointments", disabled: true },
    ]);
    const result = refineAiPlan({
      gatewayPlan: {
        toolCalls: [{ name: "count_appointments", arguments: {} }],
      },
      user: mockUser(),
      tenantOverrides: overrides,
      allowedToolNames: new Set(["count_appointments"]),
    });
    expect(result.plan.toolCalls).toHaveLength(0);
    expect(result.plan.fallback).toMatch(/regras configuradas/i);
    expect(result.filteredCount).toBe(1);
  });

  it("remove tools fora do catálogo do usuário", () => {
    const result = refineAiPlan({
      gatewayPlan: {
        toolCalls: [{ name: "create_user", arguments: {} }],
      },
      user: mockUser({ role: "BENEFICIARIO" }),
      allowedToolNames: new Set(["get_my_overview"]),
    });
    expect(result.plan.toolCalls).toHaveLength(0);
    expect(result.filteredCount).toBe(1);
  });

  it("remove tools restritas ao portal do usuário", () => {
    const result = refineAiPlan({
      gatewayPlan: {
        toolCalls: [{ name: "get_dashboard_kpis", arguments: {} }],
      },
      user: mockUser({ role: "BENEFICIARIO" }),
      allowedToolNames: new Set(["get_dashboard_kpis"]),
    });
    expect(result.plan.toolCalls).toHaveLength(0);
    expect(result.filteredCount).toBe(1);
  });

  it("repassa plano vazio do gateway para fallback híbrido no runner", () => {
    const result = refineAiPlan({
      gatewayPlan: { toolCalls: [], fallback: "Resposta livre do LLM." },
      user: mockUser(),
      allowedToolNames: new Set(["count_appointments"]),
    });
    expect(result.plan.toolCalls).toHaveLength(0);
    expect(result.plan.fallback).toBe("Resposta livre do LLM.");
    expect(result.filteredCount).toBe(0);
  });
});
