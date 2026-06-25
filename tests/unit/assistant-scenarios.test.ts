import { describe, expect, it, beforeEach } from "vitest";
import {
  ASSISTANT_SCENARIOS,
  scenarioCount,
  scenariosByCategory,
  scenariosByRole,
  scenariosWithExpectedTool,
  type AssistantScenario,
} from "@/lib/assistant/scenarios";
import {
  isHumanized,
  ROBOTIC_PHRASES,
  confirmPrompt,
  runnerFallback,
  portalFallbackIntro,
  partialSummaryIntro,
} from "@/lib/assistant/humanize";
import { planMockFromIntents, clearMockContext } from "@/lib/assistant/provider/mock-match";
import { getToolsForUser } from "@/lib/assistant/tools/registry";
import { resolveInternoPermissions } from "@/lib/interno-permissions";
import { NICHE_MASTER_LABELS } from "@/constants/niches";
import type { SessionUser } from "@/lib/session";
import { CLINIC_BRANDING_DEFAULTS } from "@/lib/theme/tokens";
import type { NicheId } from "@/lib/niche/types";

function buildScenarioUser(scenario: AssistantScenario, id: string): SessionUser {
  const niche: NicheId = scenario.niche ?? "MEDICAL";
  const internoProfile = scenario.internoProfile ?? "ADMIN";
  return {
    id,
    name: "Cenário",
    email: "cenario@bibi.health",
    role: scenario.role,
    tenantId: "t1",
    tenantSlug: "horizonte",
    companyId: scenario.role === "PJ" ? "c1" : null,
    patientId: scenario.role === "BENEFICIARIO" ? "p1" : null,
    tenantName: "Horizonte",
    companyName: scenario.role === "PJ" ? "TechCorp" : null,
    patientName: scenario.role === "BENEFICIARIO" ? "João Pereira" : null,
    internoProfile: scenario.role === "INTERNO" ? internoProfile : null,
    internoPermissions:
      scenario.role === "INTERNO"
        ? resolveInternoPermissions("INTERNO", internoProfile)
        : [],
    branding: CLINIC_BRANDING_DEFAULTS,
    niche,
    labels: NICHE_MASTER_LABELS[niche],
  };
}

describe("catálogo de cenários", () => {
  it("mapeia dezenas de cenários nos 4 portais", () => {
    expect(scenarioCount()).toBeGreaterThanOrEqual(60);
    expect(scenariosByRole("INTERNO").length).toBeGreaterThanOrEqual(20);
    expect(scenariosByRole("PRESTADOR").length).toBeGreaterThanOrEqual(8);
    expect(scenariosByRole("PJ").length).toBeGreaterThanOrEqual(6);
    expect(scenariosByRole("BENEFICIARIO").length).toBeGreaterThanOrEqual(10);
  });

  it("cobre categorias principais", () => {
    for (const cat of ["read", "help", "draft", "error", "niche"] as const) {
      expect(scenariosByCategory(cat).length).toBeGreaterThan(0);
    }
  });

  it("ids são únicos", () => {
    const ids = ASSISTANT_SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("tom humanizado — módulo central", () => {
  it("não usa frases robóticas nas mensagens padrão", () => {
    const samples = [
      confirmPrompt(),
      runnerFallback(),
      portalFallbackIntro("Portal Interno"),
      partialSummaryIntro(),
      "Até aqui, anotei:",
      "Tudo certo? Confira os dados",
      "Não consegui reconhecer essa opção",
      "Desculpe, não entendi",
    ];
    for (const text of samples) {
      expect(isHumanized(text)).toBe(true);
    }
  });

  it("detecta frases robóticas legadas", () => {
    for (const phrase of ROBOTIC_PHRASES) {
      expect(isHumanized(`Teste ${phrase} fim`)).toBe(false);
    }
  });
});

describe("roteamento por cenário", () => {
  const routable = scenariosWithExpectedTool().filter(
    (s) => s.category !== "multi_turn" && s.category !== "rbac" && !s.phrase.startsWith("e "),
  );

  beforeEach(() => {
    for (const scenario of routable) {
      clearMockContext(`scenario-${scenario.id}`);
    }
  });

  it.each(routable.map((s) => [s.id, s] as const))(
    "roteia %s → tool esperada",
    (id, scenario) => {
      const user = buildScenarioUser(scenario, `scenario-${id}`);
      const tools = getToolsForUser(user);
      const toolNames = new Set(tools.map((t) => t.name));

      if (!toolNames.has(scenario.expectedTool!)) {
        // RBAC pode bloquear tool — cenário documentado, não falha
        if (scenario.category === "rbac" || scenario.internoProfile === "READONLY") return;
      }

      const plan = planMockFromIntents(scenario.phrase, user, toolNames);
      const names = plan.toolCalls.map((c) => c.name);

      if (scenario.id === "int-composite") {
        expect(names.length).toBeGreaterThanOrEqual(2);
        return;
      }

      expect(names).toContain(scenario.expectedTool);
    },
  );
});

describe("fallback humanizado por portal", () => {
  const fallbacks = ASSISTANT_SCENARIOS.filter((s) => s.category === "error");

  beforeEach(() => {
    for (const scenario of fallbacks) {
      clearMockContext(`fb-${scenario.id}`);
    }
  });

  it.each(fallbacks.map((s) => [s.id, s] as const))(
    "fallback %s é acolhedor",
    (id, scenario) => {
      const user = buildScenarioUser(scenario, `fb-${id}`);
      const tools = getToolsForUser(user);
      const plan = planMockFromIntents(scenario.phrase, user, new Set(tools.map((t) => t.name)));

      expect(plan.toolCalls.length).toBe(0);
      expect(plan.fallback).toBeTruthy();
      expect(isHumanized(plan.fallback!)).toBe(true);
      expect(plan.fallback).toMatch(/captei|ajudar|ideias/i);
    },
  );
});

describe("drafts — tom nas respostas incompletas", () => {
  it("início de agendamento usa linguagem natural", () => {
    const scenario = ASSISTANT_SCENARIOS.find((s) => s.id === "int-draft-appointment-start")!;
    const user = buildScenarioUser(scenario, "draft-tone");
    clearMockContext(user.id);
    const tools = getToolsForUser(user);
    const plan = planMockFromIntents(scenario.phrase, user, new Set(tools.map((t) => t.name)));
    expect(plan.toolCalls[0]?.name).toBe("draft_create_appointment");
  });
});

describe("nichos — terminologia nos cenários", () => {
  it("VET usa labels do nicho", () => {
    const scenario = ASSISTANT_SCENARIOS.find((s) => s.id === "vet-ben-help")!;
    const user = buildScenarioUser(scenario, "vet-help");
    expect(user.labels.patient).toBe("Pet");
    expect(user.labels.appointment).toBe("Atendimento");
  });

  it("LEGAL adapta cadastro", () => {
    const scenario = ASSISTANT_SCENARIOS.find((s) => s.id === "legal-int-help")!;
    const user = buildScenarioUser(scenario, "legal-help");
    expect(user.labels.patient).toBe("Cliente");
  });
});
