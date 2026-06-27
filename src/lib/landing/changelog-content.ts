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
      "Onboarding em duas fases com micro-tours por módulo, segmento Engenharia Civil (ERP obras) e documentação OpenAPI completa.",
    highlights: [
      {
        title: "Onboarding v3",
        items: [
          "Tour principal condensado + micro-tours na primeira visita a cada módulo",
          "Hotspots: Cliente 360°, PIX, PEP, demo reset e mapa CRUD",
          "Mobile: drawer com data-tour-nav e botão Tour em todas as telas",
        ],
      },
      {
        title: "Engenharia Civil",
        items: [
          "ERP empreiteira: pipeline, obras, orçamentos, BDI, caixa e diário de campo",
          "Portais interno, prestador (campo), PJ e beneficiário (obras)",
        ],
      },
      {
        title: "Plataforma",
        items: [
          "OpenAPI 123 rotas + Swagger UI em /api/docs",
          "Massas demo enriquecidas multi-segmento (SEED_PROFILE)",
        ],
      },
    ],
    testStats: "415+ testes Vitest · 128+ E2E · pre-release OK",
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
          "Seção #novidades com changelog v2.1 e v2.0",
        ],
      },
      {
        title: "Segmentos e demo",
        items: [
          "Cores por nicho (pills, landing, login) via segment-colors",
          "Login demo alterna automaticamente para modo demo por segmento",
          "ROI ~91% e preços mercado 2026 documentados",
        ],
      },
      {
        title: "Voa Health (Fase 1)",
        items: [
          "Painel embed no atendimento do prestador",
          "Importação de documentos clínicos para o PEP",
          "APIs /voa e /voa/import com testes automatizados",
        ],
      },
    ],
    testStats: "395 testes Vitest · 128 E2E · pre-release OK",
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
