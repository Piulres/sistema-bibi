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
    version: "3.0.4",
    label: PLATFORM.versionLabel,
    date: "26/07/2026",
    status: "current",
    summary:
      "Qualidade e operação: guias TISS inválidas são rejeitadas antes do download, agentes Cursor carregam menos contexto fixo, e a documentação do schema-sync do banco de operação fica completa.",
    highlights: [
      {
        title: "Faturamento TISS",
        items: [
          "Guia sem procedimentos ou documento do beneficiário retorna erro claro (422)",
          "XML com caracteres especiais escapados corretamente",
          "Testes automatizados da rota de exportação TISS",
        ],
      },
      {
        title: "Agentes e documentação",
        items: [
          "Configuração Cursor enxuta: router único + rules escopadas por tarefa",
          "Runbook schema-sync do operation.db em produção (Netlify Blobs)",
          "Validação npm run cursor:verify para evitar drift de config",
        ],
      },
    ],
    testStats: "572 testes Vitest · 152 E2E · docs:verify · cursor:verify · pre-release OK",
  },
  {
    version: "3.0.3",
    label: "Sistema Bibi - ServiceOS v3.0.3",
    date: "26/07/2026",
    status: "previous",
    summary:
      "Operação mais robusta: a gestão clínica grava o schema atualizado no Blob, feedback claro ao salvar, e a base de operação CEDIG fica limpa após unificar o prontuário de teste e remover usuários efêmeros.",
    highlights: [
      {
        title: "Gestão clínica",
        items: [
          "Upgrade de schema do banco de operação persistido no Blob após o boot",
          "Mensagens de erro mais claras ao listar ou registrar lançamentos",
          "Ponte lançamento → agenda → fatura estável",
        ],
      },
      {
        title: "Operação CEDIG",
        items: [
          "Prontuário de consulta com anamnese unificada (sem duplicata)",
          "Usuários e walk-ins de smoke/golive removidos da base de operação",
          "Script auditável de limpeza pontual do operation.db",
        ],
      },
    ],
    testStats: "567 testes Vitest · E2E · docs:verify · pre-release OK",
  },
  {
    version: "3.0.2",
    label: "Sistema Bibi - ServiceOS v3.0.2",
    date: "26/07/2026",
    status: "previous",
    summary:
      "Correção operacional: a gestão clínica (CEDIG) volta a registrar lançamentos com a agenda e o faturamento sincronizados, mesmo em bancos provisionados antes da ponte Pay Per Use.",
    highlights: [
      {
        title: "Gestão clínica estável",
        items: [
          "Lançamentos e indicadores de /interno/gestao sem erro interno",
          "Sincronização de esquema do banco de operação aplicada no boot",
          "Ponte lançamento → agenda → fatura preservada",
        ],
      },
    ],
    testStats: "566 testes Vitest · 152 E2E · schema-sync · pre-release OK",
  },
  {
    version: "3.0.1",
    label: "Sistema Bibi - ServiceOS v3.0.1",
    date: "26/07/2026",
    status: "previous",
    summary:
      "Pacote de qualidade: vocabulário do tenant em todas as telas (Pet/Tutor/Cliente…), regras de negócio da agenda mais seguras e experiência multi-nicho mais consistente.",
    highlights: [
      {
        title: "Vocabulário por segmento",
        items: [
          "Faturamento, agenda, cadastros e comunicação usam os termos do tenant",
          "Estoque, breadcrumbs e mensagens seguem o nicho (pet, cliente, aluno…)",
          "Consumo do beneficiário distingue 'Faturado' de 'A faturar'",
        ],
      },
      {
        title: "Regras da agenda",
        items: [
          "Agendamento cancelado ou faltou não aceita novos procedimentos",
          "Transições de status seguem a máquina de estados (sem reabrir concluído)",
          "Mensagens de erro claras em prestador, gestão clínica e portal PJ",
        ],
      },
    ],
    testStats: "563 testes Vitest · 152 E2E · docs:verify · pre-release OK",
  },
  {
    version: "3.0.0",
    label: "Sistema Bibi - ServiceOS v3.0.0",
    date: "25/07/2026",
    status: "previous",
    summary:
      "ServiceOS v3.0: instale como app no celular (PWA) — tela cheia no iPhone/Android, sem App Store. Empilha o pacote v2.6 (CEDIG + login).",
    highlights: [
      {
        title: "App no celular",
        items: [
          "Página /instalar com guia Safari (iPhone) e Chrome (Android)",
          "Web App Manifest standalone + ícones na tela de início",
          "Metas Apple (Add to Home Screen) e smoke Netlify no pre-release",
        ],
      },
      {
        title: "Operação (v2.6)",
        items: [
          "CEDIG: lançamento na gestão alimenta agenda, PPU e fatura",
          "Exportar mês (Excel) em /interno/gestao",
          "Login com tenant digitável e seletor de portal",
        ],
      },
    ],
    testStats: "smoke-netlify-pwa · clinic-finance-bridge · e2e · docs:verify · pre-release · deploy 3.0.0",
  },
  {
    version: "2.6.0",
    label: "Sistema Bibi - ServiceOS v2.6.0",
    date: "25/07/2026",
    status: "previous",
    summary:
      "CEDIG fase 2+F: o lançamento na gestão alimenta agenda, extrato PPU e fatura; export do mês; empilha login tenant/portal (v2.5).",
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
    testStats: "clinic-finance-bridge · system-crud-matrix · e2e · docs:verify · pre-release · deploy 2.6.0",
  },
  {
    version: "2.5.0",
    label: "Sistema Bibi - ServiceOS v2.5.0",
    date: "25/07/2026",
    status: "previous",
    summary:
      "Login com tenant digitável e seletor de portal — empilhado no pacote v2.6.0.",
    highlights: [
      {
        title: "Acesso",
        items: [
          "Campo de tenant (slug) no login",
          "Seletor de portal Prestador / Interno / PJ / Beneficiário",
          "Validação de acesso por tenant + role (login-access.ts)",
        ],
      },
    ],
    testStats: "login-access · docs:verify · lint",
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
