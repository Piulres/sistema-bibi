import { describe, expect, it } from "vitest";
import { parseAssistantDate, toIsoDate } from "@/lib/assistant/dates";
import { filterToolsForUser, assertToolPermission } from "@/lib/assistant/permissions";
import { AssistantPermissionError } from "@/lib/assistant/permissions";
import { internoReadTools } from "@/lib/assistant/tools/interno/read";
import { planMockAssistant } from "@/lib/assistant/provider/mock";
import type { SessionUser } from "@/lib/session";
import { CLINIC_BRANDING_DEFAULTS } from "@/lib/theme/tokens";
import { NICHE_MASTER_LABELS } from "@/constants/niches";

const baseUser = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: "u1",
  name: "Teste",
  email: "test@bibi.health",
  role: "INTERNO",
  tenantId: "t1",
  tenantSlug: "horizonte",
  companyId: null,
  patientId: null,
  tenantName: "Horizonte",
  companyName: null,
  patientName: null,
  internoProfile: "READONLY",
  internoPermissions: ["dashboard", "relatorios", "auditoria"],
  branding: CLINIC_BRANDING_DEFAULTS,
  niche: "MEDICAL",
  labels: NICHE_MASTER_LABELS.MEDICAL,
  ...overrides,
});

describe("assistant dates", () => {
  const now = new Date("2026-06-23T15:00:00");

  it("interpreta hoje e ontem", () => {
    expect(toIsoDate(parseAssistantDate("hoje", now))).toBe("2026-06-23");
    expect(toIsoDate(parseAssistantDate("ontem", now))).toBe("2026-06-22");
  });

  it("interpreta data BR", () => {
    expect(toIsoDate(parseAssistantDate("15/06/2026", now))).toBe("2026-06-15");
  });
});

describe("assistant RBAC", () => {
  it("READONLY não vê tools de billing/cadastros", () => {
    const user = baseUser();
    const tools = filterToolsForUser(internoReadTools, user);
    const names = tools.map((t) => t.name);
    expect(names).toContain("get_dashboard_kpis");
    expect(names).toContain("get_revenue_summary");
    expect(names).not.toContain("list_debtors");
    expect(names).not.toContain("list_users");
  });

  it("bloqueia execução sem permissão", () => {
    const user = baseUser();
    const tool = internoReadTools.find((t) => t.name === "list_debtors")!;
    expect(() => assertToolPermission(user, tool)).toThrow(AssistantPermissionError);
  });

  it("ADMIN tem todas as tools read-only", () => {
    const user = baseUser({
      internoProfile: "ADMIN",
      internoPermissions: [
        "dashboard",
        "billing",
        "agenda",
        "cadastros",
        "estoque",
        "crm",
        "subscriptions",
        "comunicacao",
        "relatorios",
        "auditoria",
        "branding",
        "integracoes",
        "seguranca",
      ],
    });
    const tools = filterToolsForUser(internoReadTools, user);
    expect(tools).toHaveLength(internoReadTools.length);
  });
});

describe("assistant mock provider", () => {
  const tools = internoReadTools;

  it("roteia agendamentos de hoje", () => {
    const plan = planMockAssistant(
      [{ role: "user", content: "Quantos agendamentos temos hoje?" }],
      tools,
    );
    expect(plan.toolCalls[0]?.name).toBe("count_appointments");
  });

  it("roteia receita", () => {
    const plan = planMockAssistant(
      [{ role: "user", content: "Qual a receita de ontem?" }],
      tools,
    );
    expect(plan.toolCalls[0]?.name).toBe("get_revenue_summary");
  });

  it("roteia devedores", () => {
    const plan = planMockAssistant(
      [{ role: "user", content: "Quem está devendo?" }],
      tools,
    );
    expect(plan.toolCalls[0]?.name).toBe("list_debtors");
  });
});
