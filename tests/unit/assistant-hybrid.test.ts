import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { validateGatewayPlan } from "@/lib/assistant/rules/validate-plan";
import { shouldUseAssistantGateway } from "@/lib/assistant/plan-gateway";
import { planMockFromIntents, clearMockContext } from "@/lib/assistant/provider/mock-match";
import { getToolsForUser } from "@/lib/assistant/tools/registry";
import type { SessionUser } from "@/lib/session";
import { CLINIC_BRANDING_DEFAULTS } from "@/lib/theme/tokens";
import { NICHE_MASTER_LABELS } from "@/constants/niches";
import { resolveInternoPermissions } from "@/lib/interno-permissions";

const internoUser = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: "u-interno",
  name: "Admin Teste",
  email: "faturamento@bibi.health",
  role: "INTERNO",
  tenantId: "t1",
  tenantSlug: "horizonte",
  companyId: null,
  patientId: null,
  tenantName: "Horizonte",
  companyName: null,
  patientName: null,
  internoProfile: "ADMIN",
  internoPermissions: resolveInternoPermissions("ADMIN"),
  branding: CLINIC_BRANDING_DEFAULTS,
  niche: "MEDICAL",
  labels: NICHE_MASTER_LABELS.MEDICAL,
  ...overrides,
});

describe("assistant hybrid Phase 4", () => {
  describe("validateGatewayPlan", () => {
    it("aceita tool_calls dentro das regras e RBAC do usuário", () => {
      const allowed = new Set(["count_appointments", "get_dashboard_kpis"]);
      const userTools = new Set(["count_appointments"]);
      const result = validateGatewayPlan(
        { toolCalls: [{ name: "count_appointments", arguments: { date: "today" } }] },
        allowed,
        userTools,
      );
      expect(result?.toolCalls).toHaveLength(1);
      expect(result?.toolCalls[0]?.name).toBe("count_appointments");
    });

    it("rejeita tool desabilitada pelo tenant — retorna null para fallback mock", () => {
      const allowed = new Set(["get_dashboard_kpis"]);
      const userTools = new Set(["count_appointments", "get_dashboard_kpis"]);
      const result = validateGatewayPlan(
        { toolCalls: [{ name: "count_appointments", arguments: {} }] },
        allowed,
        userTools,
      );
      expect(result).toBeNull();
    });

    it("filtra tool fora do RBAC mas mantém as válidas", () => {
      const allowed = new Set(["count_appointments", "draft_create_user"]);
      const userTools = new Set(["count_appointments"]);
      const result = validateGatewayPlan(
        {
          toolCalls: [
            { name: "count_appointments", arguments: {} },
            { name: "draft_create_user", arguments: {} },
          ],
        },
        allowed,
        userTools,
      );
      expect(result?.toolCalls).toHaveLength(1);
      expect(result?.toolCalls[0]?.name).toBe("count_appointments");
    });
  });

  describe("shouldUseAssistantGateway", () => {
    const env = process.env;

    beforeEach(() => {
      process.env = { ...env };
    });

    afterEach(() => {
      process.env = env;
    });

    it("ativa gateway no modo IA quando env configurado", () => {
      process.env.OPENAI_BASE_URL = "https://gateway.example/v1";
      process.env.OPENAI_API_KEY = "key";
      delete process.env.ASSISTANT_PROVIDER;
      expect(shouldUseAssistantGateway("ai")).toBe(true);
    });

    it("respeita ASSISTANT_PROVIDER=mock mesmo com modo IA", () => {
      process.env.OPENAI_BASE_URL = "https://gateway.example/v1";
      process.env.OPENAI_API_KEY = "key";
      process.env.ASSISTANT_PROVIDER = "mock";
      expect(shouldUseAssistantGateway("ai")).toBe(false);
    });
  });

  describe("tenant ruleOverrides no runtime", () => {
    beforeEach(() => {
      clearMockContext("u-interno");
    });

    it("dispara tool com gatilho customizado persistido no tenant", () => {
      const user = internoUser();
      const tools = getToolsForUser(user);
      const overrides = [{ tool: "count_appointments", addTriggers: ["quantos exames hoje"] }];
      const plan = planMockFromIntents(
        "quantos exames hoje",
        user,
        new Set(tools.map((t) => t.name)),
        overrides,
      );
      expect(plan.toolCalls[0]?.name).toBe("count_appointments");
    });

    it("não roteia tool desabilitada pelo tenant", () => {
      const user = internoUser();
      const tools = getToolsForUser(user);
      const overrides = [{ tool: "count_appointments", disabled: true }];
      const plan = planMockFromIntents(
        "quantos agendamentos hoje",
        user,
        new Set(tools.map((t) => t.name)),
        overrides,
      );
      expect(plan.toolCalls.some((c) => c.name === "count_appointments")).toBe(false);
    });
  });
});
