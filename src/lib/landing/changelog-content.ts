import { PLATFORM } from "@/lib/platform";

export type ChangelogHighlight = {
  title: string;
  items: string[];
};

export type ChangelogRelease = {
  version: string;
  label: string;
  date: string;
  status: "current" | "previous";
  summary: string;
  highlights: ChangelogHighlight[];
  testStats?: string;
};

/**
 * Changelog curado da landing (#novidades).
 *
 * Fonte de verdade da UI — não parsear RELEASES.md em runtime.
 * Manutenção obrigatória ao fechar pacote: docs/plataforma/LANDING_CHANGELOG.md
 *
 * Sincronizar com: package.json, src/lib/platform.ts, docs/versoes/RELEASES.md, VX_Y.md
 * Validar: npm run docs:verify
 */
export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: "2.3.0",
    label: PLATFORM.versionLabel,
    date: "27/06/2026",
    status: "current",
    summary:
      "Assistente operacional serverless multi-nicho, ERP Engenharia Civil e onboarding guiado em duas fases nos 4 portais.",
    highlights: [
      {
        title: "Assistente operacional",
        items: [
          "Estado de sessão assinado (HMAC) — confirmação de ações funciona na Netlify",
          "RAG e procedimentos adaptados ao catálogo e vocabulário de cada nicho",
          "Copiloto contextual com sugestões por página nos 4 portais",
          "VET: agendamento tutor + pet com busca e auto-seleção",
        ],
      },
      {
        title: "Engenharia Civil",
        items: [
          "ERP empreiteira: pipeline, obras, orçamentos, BDI, caixa e diário de campo",
          "Portais interno, prestador (campo), PJ e beneficiário (obras)",
          "Dupla aprovação, metas e pipeline comercial → obra",
        ],
      },
      {
        title: "Onboarding e plataforma",
        items: [
          "Tour em duas fases + micro-tours por módulo, mobile e hotspots",
          "OpenAPI 123 rotas + Swagger UI em /api/docs",
          "Massas demo enriquecidas multi-segmento",
        ],
      },
    ],
    testStats: "495 testes Vitest · 138 E2E · pre-release OK",
  },
  {
    version: "2.2.0",
    label: "Sistema Bibi - ServiceOS v2.2",
    date: "25/06/2026",
    status: "previous",
    summary:
      "Tour guiado de onboarding nos 4 portais com spotlight, hotspots pulsantes e textos adaptados por nicho.",
    highlights: [
      {
        title: "Onboarding guiado",
        items: [
          "Product tour automático na primeira visita a cada portal",
          "Spotlight, hotspots e tooltips posicionados automaticamente",
          "Passos contextuais por rota (faturamento, agenda, agendar…)",
          "Botão Tour no header para reiniciar o guia a qualquer momento",
        ],
      },
      {
        title: "Multi-nicho",
        items: [
          "Textos do tour usam labels do tenant (paciente, pet, cliente…)",
          "Tours dedicados: interno, prestador, PJ e beneficiário",
        ],
      },
    ],
    testStats: "403 testes Vitest · 128 E2E · pre-release OK",
  },
  {
    version: "2.1.0",
    label: "Sistema Bibi - ServiceOS v2.1",
    date: "24/06/2026",
    status: "previous",
    summary:
      "Pacote pós-POC com segurança endurecida, assistente nos 4 portais, módulo VET (Pet), change management reversível e importação JSON/CSV.",
    highlights: [
      {
        title: "Segurança",
        items: [
          "Validação HMAC do cookie de sessão no proxy",
          "Rate limit em login e MFA",
          "Headers CSP/HSTS e RBAC de usuários restrito a ADMIN",
        ],
      },
      {
        title: "Assistente operacional",
        items: [
          "Chat nos 4 portais com mock de 350+ gatilhos",
          "Ações com confirmação e desambiguação multi-turno",
          "Agendamento por procedimento sem prestador obrigatório",
        ],
      },
      {
        title: "VET / Pet",
        items: [
          "Entidade Pet com ficha clínica, vacinas e walk-in",
          "APIs nos portais interno, prestador e beneficiário",
        ],
      },
    ],
    testStats: "395 testes Vitest · 128 E2E · pre-release OK",
  },
];
