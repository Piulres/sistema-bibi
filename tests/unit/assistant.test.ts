import { describe, expect, it, beforeEach } from "vitest";
import { parseAssistantDate, toIsoDate } from "@/lib/assistant/dates";
import { assertToolPermission, AssistantPermissionError } from "@/lib/assistant/permissions";
import { filterToolsForUser } from "@/lib/assistant/tools/registry";
import { internoReadTools } from "@/lib/assistant/tools/interno/read";
import { internoWriteTools } from "@/lib/assistant/tools/interno/write";
import { prestadorReadTools } from "@/lib/assistant/tools/prestador/read";
import { planMockAssistant } from "@/lib/assistant/provider/mock";
import { countMockTriggers } from "@/lib/assistant/provider/mock-intents";
import { planMockFromIntents, clearMockContext } from "@/lib/assistant/provider/mock-match";
import { searchKnowledge } from "@/lib/assistant/rag/knowledge";
import {
  createPendingAction,
  consumePendingAction,
  cancelPendingAction,
} from "@/lib/assistant/pending-actions";
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

const adminUser = () =>
  baseUser({
    internoProfile: "ADMIN",
    internoPermissions: [
      "dashboard",
      "billing",
      "agenda",
      "cadastros",
      "relatorios",
      "auditoria",
      "estoque",
      "crm",
      "subscriptions",
      "comunicacao",
      "branding",
      "integracoes",
      "seguranca",
    ],
  });

describe("mock trigger catalog", () => {
  it("tem centenas de gatilhos únicos", () => {
    const count = countMockTriggers();
    expect(count).toBeGreaterThanOrEqual(350);
  });
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

  it("READONLY não executa draft_create_user", () => {
    const user = baseUser();
    const tool = internoWriteTools.find((t) => t.name === "draft_create_user")!;
    expect(() => assertToolPermission(user, tool)).toThrow(AssistantPermissionError);
  });

  it("prestador tem tools próprias", () => {
    const user = baseUser({ role: "PRESTADOR", internoPermissions: [] });
    const tools = filterToolsForUser(prestadorReadTools, user);
    expect(tools.map((t) => t.name)).toContain("get_prestador_dashboard");
  });
});

describe("assistant mock variations", () => {
  const user = adminUser();
  const tools = [...internoReadTools, ...internoWriteTools];
  const toolNames = new Set(tools.map((t) => t.name));

  beforeEach(() => {
    clearMockContext(user.id);
  });

  const cases: [string, string][] = [
    ["Quantos agendamentos temos hoje?", "count_appointments"],
    ["Qual a lotação do dia?", "count_appointments"],
    ["Quanto faturamos ontem?", "get_revenue_summary"],
    ["Panorama financeiro de hoje", "get_revenue_summary"],
    ["Quem está devendo?", "list_debtors"],
    ["Lista de inadimplentes", "list_debtors"],
    ["Resumo executivo", "get_dashboard_kpis"],
    ["Como está a operação?", "get_dashboard_kpis"],
    ["Listar usuários do sistema", "list_users"],
    ["Como faturar um paciente?", "explain_capability"],
    ["Criar usuário João joao@x.com senha bibi123 prestador", "draft_create_user"],
    ["Agendamentos de hoje e quem está devendo", "count_appointments"],
  ];

  it.each(cases)("entende: %s", (phrase, expectedTool) => {
    const plan = planMockAssistant([{ role: "user", content: phrase }], tools, user);
    const names = plan.toolCalls.map((c) => c.name);
    expect(names).toContain(expectedTool);
  });

  it("pergunta composta dispara múltiplas tools", () => {
    const plan = planMockFromIntents("Agendamentos de hoje e quem está devendo", user, toolNames);
    expect(plan.toolCalls.length).toBeGreaterThanOrEqual(2);
    expect(plan.toolCalls.map((c) => c.name)).toContain("count_appointments");
    expect(plan.toolCalls.map((c) => c.name)).toContain("list_debtors");
  });

  it("sinônimos de receita", () => {
    const phrases = ["Quanto entrou hoje?", "Fechamento financeiro de ontem", "Volume faturado"];
    for (const phrase of phrases) {
      const plan = planMockFromIntents(phrase, user, toolNames);
      expect(plan.toolCalls[0]?.name).toBe("get_revenue_summary");
    }
  });
});

describe("assistant pending actions", () => {
  it("cria e consome ação pendente", () => {
    const id = createPendingAction("u1", "t1", {
      type: "create_user",
      data: {
        name: "João",
        email: "joao@test.com",
        password: "bibi123",
        role: "PRESTADOR",
      },
    });
    const payload = consumePendingAction(id, "u1", "t1");
    expect(payload?.type).toBe("create_user");
    expect(consumePendingAction(id, "u1", "t1")).toBeNull();
  });

  it("cancela ação pendente", () => {
    const id = createPendingAction("u1", "t1", {
      type: "create_patient",
      data: { name: "Ana", cpf: "52998224725", birthDate: "1990-01-01" },
    });
    expect(cancelPendingAction(id, "u1", "t1")).toBe(true);
    expect(consumePendingAction(id, "u1", "t1")).toBeNull();
  });
});

describe("assistant RAG", () => {
  it("encontra trechos sobre faturamento", () => {
    const chunks = searchKnowledge("faturamento pay per use");
    expect(chunks.length).toBeGreaterThan(0);
  });
});
