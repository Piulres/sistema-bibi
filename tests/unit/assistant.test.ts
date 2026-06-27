import { describe, expect, it, beforeEach } from "vitest";
import { parseAssistantDate, toIsoDate } from "@/lib/assistant/dates";
import { assertToolPermission, AssistantPermissionError } from "@/lib/assistant/permissions";
import { filterToolsForUser, getToolsForUser } from "@/lib/assistant/tools/registry";
import { internoReadTools } from "@/lib/assistant/tools/interno/read";
import { internoWriteTools } from "@/lib/assistant/tools/interno/write";
import { prestadorReadTools } from "@/lib/assistant/tools/prestador/read";
import { planMockAssistant } from "@/lib/assistant/provider/mock";
import { countMockTriggers } from "@/lib/assistant/provider/mock-intents";
import { planMockFromIntents, clearMockContext } from "@/lib/assistant/provider/mock-match";
import { runAssistantChat } from "@/lib/assistant/runner";
import { searchKnowledge } from "@/lib/assistant/rag/knowledge";
import {
  createPendingAction,
  consumePendingAction,
  cancelPendingAction,
} from "@/lib/assistant/pending-actions";
import type { SessionUser } from "@/lib/session";
import { CLINIC_BRANDING_DEFAULTS } from "@/lib/theme/tokens";
import { NICHE_MASTER_LABELS } from "@/constants/niches";
import { resolveInternoPermissions } from "@/lib/interno-permissions";
import { mergeNicheLabels } from "@/lib/niche/labels";
import { applyNicheBrandingDefaults } from "@/lib/niche/branding";
import { isNicheId } from "@/lib/niche/types";
import { resolveFromOptions } from "@/lib/assistant/resolve-entities";
import { parseChoiceSelection, extractCreateAppointmentArgs } from "@/lib/assistant/provider/mock-extractors";
import { filterAssistantActions, isAssistantAction } from "@/lib/assistant/types";
import { DEMO_EMAILS } from "../helpers/seed-fixtures";
import { getTestPrisma } from "../helpers/db";

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

describe("assistant action guards", () => {
  it("filtra actions malformadas da API", () => {
    const filtered = filterAssistantActions([
      { type: "link", label: "Ver agenda", href: "/interno/agenda" },
      { type: "table", title: "Sem colunas" },
      { type: "unknown", foo: 1 },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].type).toBe("link");
  });

  it("aceita table com columns e rows", () => {
    expect(
      isAssistantAction({
        type: "table",
        title: "Pendências",
        columns: ["A", "B"],
        rows: [["1", "2"]],
      }),
    ).toBe(true);
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
  const tools = getToolsForUser(user);
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

describe("assistant draft multi-turn", () => {
  beforeEach(() => {
    clearMockContext("draft-flow-user");
  });

  it("guia agendamento incremental até pedir confirmação", async () => {
    const prisma = getTestPrisma();
    const dbUser = await prisma.user.findFirst({
      where: { email: DEMO_EMAILS.internoRecepcao },
      include: { tenant: { include: { branding: true } } },
    });
    expect(dbUser?.tenant).toBeTruthy();

    const niche = isNicheId(dbUser!.tenant!.niche) ? dbUser!.tenant!.niche : "MEDICAL";
    const user: SessionUser = {
      id: "draft-flow-user",
      name: dbUser!.name,
      email: dbUser!.email,
      role: dbUser!.role,
      tenantId: dbUser!.tenantId,
      tenantSlug: dbUser!.tenant!.slug,
      companyId: null,
      patientId: null,
      tenantName: dbUser!.tenant!.name,
      companyName: null,
      patientName: null,
      internoProfile: dbUser!.internoProfile,
      internoPermissions: resolveInternoPermissions(dbUser!.role, dbUser!.internoProfile),
      branding: applyNicheBrandingDefaults(niche, CLINIC_BRANDING_DEFAULTS),
      niche,
      labels: mergeNicheLabels(niche, dbUser!.tenant!.labels),
    };

    const messages: { role: "user" | "assistant"; content: string }[] = [];

    const step1 = await runAssistantChat({
      user,
      messages: [...messages, { role: "user", content: "preciso marcar uma consulta" }],
    });
    expect(step1.message.content).toMatch(/Para quem|paciente/i);
    expect(step1.actions).toBeUndefined();

    messages.push({ role: "user", content: "preciso marcar uma consulta" }, step1.message);

    const step2 = await runAssistantChat({
      user,
      messages: [...messages, { role: "user", content: "é pro João Pereira" }],
    });
    expect(step2.message.content).toMatch(/João|Prestador|Dra|data|horário/i);

    messages.push({ role: "user", content: "é pro João Pereira" }, step2.message);

    const step3 = await runAssistantChat({
      user,
      messages: [...messages, { role: "user", content: "amanhã às 15h com a Dra Helena" }],
    });
    expect(step3.actions?.some((a) => a.type === "confirm")).toBe(true);
    expect(step3.message.content).toMatch(/confirme/i);
  });
});

describe("assistant disambiguation", () => {
  it("parseChoiceSelection aceita número ou nome", () => {
    const options = [
      { id: "a", label: "João Pereira", detail: "529.982.247-25" },
      { id: "b", label: "João Silva", detail: "999.000.111-22" },
    ];
    expect(parseChoiceSelection("2", options)).toBe("b");
    expect(parseChoiceSelection("João Silva", options)).toBe("b");
  });

  it("resolveFromOptions detecta ambiguidade", () => {
    const result = resolveFromOptions(
      [
        { id: "1", label: "Ana Costa" },
        { id: "2", label: "Ana Lima" },
      ],
      "Ana",
    );
    expect(result.status).toBe("ambiguous");
  });

  it("pede escolha quando há vários pacientes com mesmo nome", async () => {
    const prisma = getTestPrisma();
    const dbUser = await prisma.user.findFirst({
      where: { email: DEMO_EMAILS.internoRecepcao },
      include: { tenant: { include: { branding: true } } },
    });
    const niche = isNicheId(dbUser!.tenant!.niche) ? dbUser!.tenant!.niche : "MEDICAL";
    const user: SessionUser = {
      id: "disambig-user",
      name: dbUser!.name,
      email: dbUser!.email,
      role: dbUser!.role,
      tenantId: dbUser!.tenantId,
      tenantSlug: dbUser!.tenant!.slug,
      companyId: null,
      patientId: null,
      tenantName: dbUser!.tenant!.name,
      companyName: null,
      patientName: null,
      internoProfile: dbUser!.internoProfile,
      internoPermissions: resolveInternoPermissions(dbUser!.role, dbUser!.internoProfile),
      branding: applyNicheBrandingDefaults(niche, CLINIC_BRANDING_DEFAULTS),
      niche,
      labels: mergeNicheLabels(niche, dbUser!.tenant!.labels),
    };
    clearMockContext(user.id);

    const anaCount = await prisma.patient.count({
      where: { tenantId: dbUser!.tenantId, name: { contains: "Ana" } },
    });
    if (anaCount < 2) return;

    const result = await runAssistantChat({
      user,
      messages: [
        {
          role: "user",
          content: "Agendar consulta para Ana amanhã às 10:00 com Dra Helena",
        },
      ],
    });

    expect(result.message.content).toMatch(/opções|Qual é a correta/i);
    expect(result.actions?.some((a) => a.type === "choice")).toBe(true);
  });

  it("lista prestadores quando o usuário não sabe o médico", async () => {
    const prisma = getTestPrisma();
    const dbUser = await prisma.user.findFirst({
      where: { email: DEMO_EMAILS.internoRecepcao },
      include: { tenant: { include: { branding: true } } },
    });
    const niche = isNicheId(dbUser!.tenant!.niche) ? dbUser!.tenant!.niche : "MEDICAL";
    const user: SessionUser = {
      id: "provider-list-user",
      name: dbUser!.name,
      email: dbUser!.email,
      role: dbUser!.role,
      tenantId: dbUser!.tenantId,
      tenantSlug: dbUser!.tenant!.slug,
      companyId: null,
      patientId: null,
      tenantName: dbUser!.tenant!.name,
      companyName: null,
      patientName: null,
      internoProfile: dbUser!.internoProfile,
      internoPermissions: resolveInternoPermissions(dbUser!.role, dbUser!.internoProfile),
      branding: applyNicheBrandingDefaults(niche, CLINIC_BRANDING_DEFAULTS),
      niche,
      labels: mergeNicheLabels(niche, dbUser!.tenant!.labels),
    };
    clearMockContext(user.id);

    const step1 = await runAssistantChat({
      user,
      messages: [
        {
          role: "user",
          content: "marcar consulta para João Pereira amanhã às 11h, não sei o médico",
        },
      ],
    });

    expect(step1.message.content).toMatch(/opções|prestador/i);
    expect(step1.actions?.some((a) => a.type === "choice")).toBe(true);

    const choice = step1.actions?.find((a) => a.type === "choice");
    const helena =
      choice?.type === "choice"
        ? choice.options.find((o) => /helena/i.test(o.label))
        : undefined;

    const step2 = await runAssistantChat({
      user,
      messages: [
        {
          role: "user",
          content: "marcar consulta para João Pereira amanhã às 11h, não sei o médico",
        },
        step1.message,
        { role: "user", content: helena?.label ?? "1" },
      ],
    });

    expect(step2.actions?.some((a) => a.type === "confirm")).toBe(true);
  });

  it("agenda pelo procedimento e pede escolha de prestador", async () => {
    const prisma = getTestPrisma();
    const dbUser = await prisma.user.findFirst({
      where: { email: DEMO_EMAILS.internoRecepcao },
      include: { tenant: { include: { branding: true } } },
    });
    const niche = isNicheId(dbUser!.tenant!.niche) ? dbUser!.tenant!.niche : "MEDICAL";
    const user: SessionUser = {
      id: "procedure-book-user",
      name: dbUser!.name,
      email: dbUser!.email,
      role: dbUser!.role,
      tenantId: dbUser!.tenantId,
      tenantSlug: dbUser!.tenant!.slug,
      companyId: null,
      patientId: null,
      tenantName: dbUser!.tenant!.name,
      companyName: null,
      patientName: null,
      internoProfile: dbUser!.internoProfile,
      internoPermissions: resolveInternoPermissions(dbUser!.role, dbUser!.internoProfile),
      branding: applyNicheBrandingDefaults(niche, CLINIC_BRANDING_DEFAULTS),
      niche,
      labels: mergeNicheLabels(niche, dbUser!.tenant!.labels),
    };
    clearMockContext(user.id);

    const step1 = await runAssistantChat({
      user,
      messages: [
        {
          role: "user",
          content: "marcar eletrocardiograma para João Pereira amanhã às 11h",
        },
      ],
    });

    expect(step1.message.content).toMatch(/eletrocardiograma|opções|prestador/i);
    expect(step1.actions?.some((a) => a.type === "choice")).toBe(true);
  });
});

describe("appointment draft resolver", () => {
  it("extractCreateAppointmentArgs detecta providerUnknown", () => {
    const args = extractCreateAppointmentArgs(
      "marcar consulta para João Pereira amanhã às 11h, não sei o médico",
    );
    expect(args.providerUnknown).toBe(true);
    expect(args.patientName).toBe("João Pereira");
    expect(args.time).toBe("11:00");
    expect(args.procedureName).toBeUndefined();
  });

  it("planMock roteia providerUnknown para draft_create_appointment", () => {
    const user = adminUser();
    clearMockContext(user.id);
    const tools = filterToolsForUser(internoReadTools.concat(internoWriteTools), user);
    const plan = planMockFromIntents(
      "marcar consulta para João Pereira amanhã às 11h, não sei o médico",
      user,
      new Set(tools.map((t) => t.name)),
    );
    expect(plan.toolCalls[0]?.name).toBe("draft_create_appointment");
    expect(plan.toolCalls[0]?.arguments).toMatchObject({
      providerUnknown: true,
      patientName: "João Pereira",
    });
  });

  it("oferece lista de prestadores quando providerUnknown", async () => {
    const prisma = getTestPrisma();
    const tenant = await prisma.tenant.findFirst({ where: { slug: "horizonte" } });
    const { resolveAppointmentDraft } = await import("@/lib/assistant/appointment-draft");
    const result = await resolveAppointmentDraft({
      tenantId: tenant!.id,
      labels: NICHE_MASTER_LABELS.MEDICAL,
      data: {
        patientName: "João Pereira",
        date: "amanhã",
        time: "11:00",
        providerUnknown: true,
      },
    });
    expect("result" in result && result.result && "__assistant_choices" in result.result).toBe(true);
  });
});

describe("assistant portal concepts", () => {
  it("roteia ajuda no portal prestador", () => {
    const user = baseUser({ role: "PRESTADOR" });
    clearMockContext(user.id);
    const tools = getToolsForUser(user);
    const plan = planMockFromIntents(
      "como funciona minha agenda?",
      user,
      new Set(tools.map((t) => t.name)),
    );
    expect(plan.toolCalls[0]?.name).toBe("explain_capability");
  });

  it("roteia ajuda no portal beneficiário", () => {
    const user = baseUser({ role: "BENEFICIARIO", patientId: "p1" });
    clearMockContext(user.id);
    const tools = getToolsForUser(user);
    const plan = planMockFromIntents(
      "como agendar consulta?",
      user,
      new Set(tools.map((t) => t.name)),
    );
    expect(plan.toolCalls[0]?.name).toBe("explain_capability");
  });

  it("buildPortalUiCopy adapta chips ao nicho VET", async () => {
    const { buildPortalUiCopy } = await import("@/lib/assistant/portal-ui");
    const copy = buildPortalUiCopy("beneficiario", NICHE_MASTER_LABELS.VET);
    expect(
      copy.suggestions.some((s) => /pet|tutor|atendimento/i.test(s)) ||
        copy.emptyExamples.some((s) => /pet|tutor|atendimento/i.test(s)),
    ).toBe(true);
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
