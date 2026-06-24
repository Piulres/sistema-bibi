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

/** Curado de docs/versoes/RELEASES.md e V2_1.md — atualizar ao fechar pacote. */
export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: "2.1.0",
    label: PLATFORM.versionLabel,
    date: "24/06/2026",
    status: "current",
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
          "Entidade Pet com ficha clínica, vacinas e medicação",
          "Walk-in com pet e listas clínicas do tutor",
          "Demo PetCare com branding e vocabulário veterinário",
        ],
      },
      {
        title: "Operação e integração",
        items: [
          "Change management: reversão de faturas, PPU e estoque",
          "Importação JSON/CSV de cadastros (patients, providers, companies, procedures)",
          "OpenAPI v2.1 com +15 paths documentados",
        ],
      },
      {
        title: "Landing e marketing",
        items: [
          "CTA WhatsApp, SEO enriquecido e tags UTM",
          "Identidade visual Energia Brasileira",
          "Home produto e landings por segmento",
        ],
      },
    ],
    testStats: "384 testes Vitest · 128 E2E · pre-release OK",
  },
  {
    version: "2.0.0",
    label: "Sistema Bibi - ServiceOS v2.0",
    date: "23/06/2026",
    status: "previous",
    summary:
      "Marca oficial ServiceOS, arquitetura multi-nicho com white label e seis segmentos de demonstração.",
    highlights: [
      {
        title: "Multi-nicho",
        items: [
          "Tenant.niche e useLabels() para vocabulário adaptável",
          "Roteamento por tenant (?tenant=) e cookie bibi_segment",
          "Demos: PetCare, Smile, Lex, Zen, EduPrime e Horizonte Saúde",
        ],
      },
      {
        title: "Plataforma",
        items: [
          "Quatro portais integrados (Interno, Prestador, PJ, Beneficiário)",
          "ROI demonstrável (~87%) com transparência auditável",
          "Massas demo e operação validadas com db:verify",
        ],
      },
    ],
    testStats: "163 testes Vitest · db:verify demo + operation",
  },
];

export const CURRENT_RELEASE = CHANGELOG_RELEASES[0];

export const CHANGELOG_SECTION = {
  eyebrow: "Novidades",
  title: "O que há de novo na demonstração",
  description:
    "Acompanhe as entregas do ServiceOS — pacotes fechados com funcionalidades prontas para explorar nos portais de demonstração.",
} as const;
