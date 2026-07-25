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
    version: "2.6.0",
    label: PLATFORM.versionLabel,
    date: "25/07/2026",
    status: "current",
    summary:
      "CEDIG fase 2: o lançamento na gestão alimenta agenda do médico, extrato PPU e fatura — e a secretária exporta o mês em Excel.",
    highlights: [
      {
        title: "Fluxo ponta a ponta",
        items: [
          "Lançamento gera Appointment REALIZADO + ProcedureUsage + Invoice/Payment",
          "Agenda → botão Lançar na gestão com dados pré-preenchidos",
          "Convênio fecha fatura na empresa; particular marca pagamento",
        ],
      },
      {
        title: "Operação",
        items: [
          "Exportar mês (Excel) em /interno/gestao",
          "READONLY não altera lançamentos/despesas",
          "Coluna Ponte na lista de lançamentos (SYNCED / PARTIAL / FAILED)",
        ],
      },
    ],
    testStats: "clinic-finance-bridge · e2e/cedig-gestao 6/6 · docs:verify · lint",
  },
  {
    version: "2.4.0",
    label: "Sistema Bibi - ServiceOS v2.4.0",
    date: "25/07/2026",
    status: "previous",
    summary:
      "Piloto CEDIG Cruzeiro: gestão clínica com lançamentos, despesas e indicadores automáticos — a secretária lança, o sistema calcula.",
    highlights: [
      {
        title: "Gestão clínica (CEDIG)",
        items: [
          "Nova aba /interno/gestao — lançamentos por paciente, despesas e KPIs",
          "Tabelas Particular, CentralMed, Bem Saúde e Dr Saúde com valor sugerido",
          "Produção por médico, frascos de biópsia, ticket médio e lucro operacional",
        ],
      },
    ],
    testStats: "clinic-finance · RBAC · pre-release",
  },
  {
    version: "2.3.1",
    label: "Sistema Bibi - ServiceOS v2.3.1",
    date: "25/07/2026",
    status: "previous",
    summary:
      "Versão do pacote visível no título do navegador e no rodapé da home, com documentação e produção alinhadas.",
    highlights: [
      {
        title: "Identidade da versão",
        items: [
          "Title da aplicação com semver completo (v2.3.1)",
          "Rodapé da home exibe ServiceOS v2.3.1",
          "Fonte única PLATFORM.release sincronizada com package.json",
        ],
      },
    ],
    testStats: "docs:verify · openapi:verify · pre-release",
  },
  {
    version: "2.3.0",
    label: "Sistema Bibi - ServiceOS v2.3",
    date: "27/06/2026",
    status: "previous",
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
];

export const CURRENT_RELEASE = CHANGELOG_RELEASES[0];

export const CHANGELOG_SECTION = {
  eyebrow: "Novidades",
  title: "O que há de novo na demonstração",
  description:
    "Acompanhe as entregas do ServiceOS — pacotes fechados com funcionalidades prontas para explorar nos portais de demonstração.",
} as const;
