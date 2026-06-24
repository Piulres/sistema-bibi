import { describe, expect, it } from "vitest";
import { parseAssistantDate, toIsoDate } from "@/lib/assistant/dates";
import { assertToolPermission, AssistantPermissionError } from "@/lib/assistant/permissions";
import { filterToolsForUser } from "@/lib/assistant/tools/registry";
import { internoReadTools } from "@/lib/assistant/tools/interno/read";
import { internoWriteTools } from "@/lib/assistant/tools/interno/write";
import { prestadorReadTools } from "@/lib/assistant/tools/prestador/read";
import { planMockAssistant } from "@/lib/assistant/provider/mock";
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

  it("ADMIN tem tools read e write", () => {
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
    const read = filterToolsForUser(internoReadTools, user);
    const write = filterToolsForUser(internoWriteTools, user);
    expect(read.length).toBe(internoReadTools.length);
    expect(write.length).toBe(internoWriteTools.length);
  });

  it("prestador tem tools próprias", () => {
    const user = baseUser({ role: "PRESTADOR", internoPermissions: [] });
    const tools = filterToolsForUser(prestadorReadTools, user);
    expect(tools.map((t) => t.name)).toContain("get_prestador_dashboard");
  });
});

describe("assistant mock provider", () => {
  const user = baseUser({
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
  const tools = [...internoReadTools, ...internoWriteTools];

  it("roteia agendamentos de hoje", () => {
    const plan = planMockAssistant(
      [{ role: "user", content: "Quantos agendamentos temos hoje?" }],
      tools,
      user,
    );
    expect(plan.toolCalls[0]?.name).toBe("count_appointments");
  });

  it("roteia criação de usuário", () => {
    const plan = planMockAssistant(
      [{ role: "user", content: "Criar usuário João Silva joao@test.com senha bibi123 prestador" }],
      tools,
      user,
    );
    expect(plan.toolCalls[0]?.name).toBe("draft_create_user");
  });

  it("roteia explicação (RAG)", () => {
    const plan = planMockAssistant(
      [{ role: "user", content: "Como faturar um paciente?" }],
      tools,
      user,
    );
    expect(plan.toolCalls[0]?.name).toBe("explain_capability");
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
