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
    version: "3.0.20",
    label: PLATFORM.versionLabel,
    date: "27/07/2026",
    status: "current",
    summary:
      "Assistente Fase 4: IA híbrida — gateway validado pelo motor de regras antes de executar tools.",
    highlights: [
      {
        title: "Assistente",
        items: [
          "Pipeline LLM → motor de regras → tools (Fase 4)",
          "Tools desabilitadas pelo tenant bloqueadas mesmo em modo IA",
          "Fallback híbrido: gateway sem tools → motor de regras no texto",
        ],
      },
    ],
    testStats: "836 testes Vitest",
  },
  {
    version: "3.0.19",
    label: "Sistema Bibi - ServiceOS v3.0.19",
    date: "27/07/2026",
    status: "previous",
    summary:
      "Assistente Fase 3: CRUD de regras por tenant; marca circular whitelabel na PWA e UI.",
    highlights: [
      {
        title: "Assistente",
        items: [
          "Painel CRUD de ruleOverrides — add/remove gatilhos e desativar tool",
          "Preview efetivo global → nicho → tenant após salvar",
        ],
      },
      {
        title: "Marca / PWA",
        items: [
          "Brand mark circular whitelabel e ícones regeneráveis",
          "API /api/brand/mark para assets da marca",
        ],
      },
    ],
    testStats:
      "CI unit+E2E #325/#329/#330 · assistant-rule-engine · brand-mark · pre-release OK · prod 6a66f3a7",
  },
  {
    version: "3.0.18",
    label: "Sistema Bibi - ServiceOS v3.0.18",
    date: "27/07/2026",
    status: "previous",
    summary:
      "Estoque Fase 3: produtos sem lote (SEM-LOTE); Assistente com motor de regras e overrides por nicho.",
    highlights: [
      {
        title: "Estoque clínico",
        items: [
          "Campo requiresLot — produto pode dispensar rastreio ANVISA de lote/validade",
          "Entrada sem lote cria SEM-LOTE; UI mostra badge e omite campos de validade",
          "Alertas de validade ignoram lotes sintéticos",
        ],
      },
      {
        title: "Assistente",
        items: [
          "Motor de regras Fase 2 com overrides por nicho e tenant",
        ],
      },
    ],
    testStats:
      "CI unit+E2E #319/#321/#326 · stock · assistant-rule-engine · docs:verify · pre-release OK · prod 6a66e9d6",
  },
  {
    version: "3.0.17",
    label: "Sistema Bibi - ServiceOS v3.0.17",
    date: "27/07/2026",
    status: "previous",
    summary:
      "Cliente 360° sem backdoor clínico para RECEPCAO; a11y de teclado; confirmação automática de agenda self-service.",
    highlights: [
      {
        title: "Auditoria / RBAC clínico",
        items: [
          "GET /clinical e corpo de PEP só para ADMIN — cadastros deixa de vazar prontuário",
          "Overview/export omitem medicalRecords para perfis sem detalhe clínico",
          "OpenAPI documenta capabilities da auditoria",
        ],
      },
      {
        title: "Acessibilidade",
        items: [
          "Focus trap, tab order e roving tabindex em overlays e TabBar",
        ],
      },
      {
        title: "Agenda do beneficiário",
        items: [
          "Self-service nasce em CONFIRMADO com e-mail APPOINTMENT_CONFIRMATION",
        ],
      },
    ],
    testStats:
      "CI unit+E2E #292/#317/#318 · patient-clinical-rbac · scheduling-auto-confirm · a11y-focus · prod 6a66e5f9",
  },
  {
    version: "3.0.16",
    label: "Sistema Bibi - ServiceOS v3.0.16",
    date: "27/07/2026",
    status: "previous",
    summary:
      "Beneficiário reagenda consulta; Assistente Fase 0; estoque clínico com edição, status de lote e reversão na UI.",
    highlights: [
      {
        title: "Agenda do beneficiário",
        items: [
          "Botão Reagendar na Minha agenda — troca horário no mesmo agendamento",
          "API PATCH action=reschedule com validação de slot e timeline RESCHEDULED",
        ],
      },
      {
        title: "Assistente",
        items: [
          "Fase 0: inventário de rotinas, módulo RBAC e Tenant.settings",
          "Painel /interno/assistente + chat com persistência e auto-scroll",
        ],
      },
      {
        title: "Estoque clínico",
        items: [
          "Editar e inativar produtos; alterar status de lote na tela",
          "Botão Reverter em movimentações com lote",
          "Categorias/unidades multi-nicho (SERVICO, KIT, SC, M3)",
        ],
      },
      {
        title: "Auditoria / RBAC",
        items: [
          "Busca por descrição só em tipos full — sem oráculo de existência clínica/PII",
          "Encaminhamento e receita classificados como clínicos; export 360° respeita perfil",
        ],
      },
    ],
    testStats:
      "CI unit+E2E #282/#286/#304/#306/#308 · audit-rbac-content · stock · prod 6a66e102",
  },
  {
    version: "3.0.15",
    label: "Sistema Bibi - ServiceOS v3.0.15",
    date: "27/07/2026",
    status: "previous",
    summary:
      "Gestão clínica mais rápida para a recepção: indicadores do mês no topo, refresh sem blank e extras clínicos recolhidos.",
    highlights: [
      {
        title: "Gestão clínica",
        items: [
          "Faixa de KPIs (receita, exames, despesas, lucro) sempre visível em /interno/gestao",
          "Troca de mês e salvamento com refresh soft — formulário permanece na tela",
          "Extras clínicos (biópsia, polipectomia, clips) recolhidos no fluxo rápido",
          "Indicadores detalhados carregam sob demanda na aba Indicadores",
        ],
      },
    ],
    testStats:
      "CI unit+E2E #290/#303 · clinic-finance-month-strip · cedig-gestao · docs:verify · pre-release OK · prod 6a66de5b",
  },
  {
    version: "3.0.14",
    label: "Sistema Bibi - ServiceOS v3.0.14",
    date: "27/07/2026",
    status: "previous",
    summary:
      "Auditoria com RBAC de conteúdo, estoque clínico, cadastros mais rápidos e documentos de saída (receita, exames, encaminhamento) com guias PDF.",
    highlights: [
      {
        title: "Auditoria / RBAC",
        items: [
          "Política central de sensibilidade (clínico, financeiro, PII, segurança, operacional)",
          "FATURAMENTO e READONLY recebem diffs/mascaramento adequados; RECEPCAO sem vazamento clínico no dashboard",
          "Restore administrativo só para ADMIN; export e revisões já redigidos no servidor",
        ],
      },
      {
        title: "Estoque clínico",
        items: [
          "Reversão de movimentações com lote (incluindo ENTRADA e DISPENSACAO)",
          "Dispensação bloqueada em agendamento cancelado ou faltoso",
          "Cobertura Vitest ampliada do catálogo, FIFO, kits e atendimento",
        ],
      },
      {
        title: "Cadastros",
        items: [
          "Cada aba busca só os dados necessários — sem bloquear a tela no carregamento das quatro listas",
          "Abas secundárias em code-split (next/dynamic); Beneficiários permanece no bundle inicial",
        ],
      },
      {
        title: "Documentos de saída",
        items: [
          "Encaminhamento com templates por especialidade e guia PDF A4",
          "Impressão de receita e pedido de exames; pacote completo do atendimento",
          "Painel do beneficiário em /beneficiario/documentos para baixar as guias",
        ],
      },
    ],
    testStats:
      "CI unit+E2E · audit-access · audit-rbac-content · stock · cadastros-resolve-tab · documentos-saida · docs:verify · pre-release OK · prod 6a66dac3",
  },
  {
    version: "3.0.13",
    label: "Sistema Bibi - ServiceOS v3.0.13",
    date: "27/07/2026",
    status: "previous",
    summary:
      "Exportações autenticadas corrigidas (fetch+blob) e equipe no atendimento com receita multi-item no Portal Prestador.",
    highlights: [
      {
        title: "Exportações",
        items: [
          "PDF, Excel, CSV, JSON e XML TISS baixam via fetch autenticado — sem erro JSON salvo como .pdf",
          "Content-Disposition UTF-8 para nomes com acentos",
          "DownloadLink reutilizável para TISS, LGPD, import/export e .ics",
        ],
      },
      {
        title: "Portal Prestador",
        items: [
          "Equipe no atendimento (anestesista, técnicos) com custos PPU",
          "Receita multi-medicamento com templates e histórico",
          "Aba Equipe no atendimento com papéis por nicho",
        ],
      },
    ],
    testStats:
      "CI unit+E2E · Job Summary · exports-matrix · download-export · appointment-team · docs:verify · pre-release OK · prod 6a66d114",
  },
  {
    version: "3.0.12",
    label: "Sistema Bibi - ServiceOS v3.0.12",
    date: "27/07/2026",
    status: "previous",
    summary:
      "Dashboard Executivo com KPIs claros: cobrança (a receber / recebido / a faturar) separada da produção clínica do mês.",
    highlights: [
      {
        title: "Dashboard",
        items: [
          "Hero de Cobrança: A receber, Recebido e A faturar — sem o rótulo ambíguo Total faturado",
          "Produção clínica do mês com eixo próprio (Valor lançado ≠ total de faturas)",
          "Mês clínico em fuso America/Sao_Paulo",
        ],
      },
    ],
    testStats: "CI unit+E2E · executive-dashboard-kpis · interno-modules · docs:verify · pre-release OK",
  },
  {
    version: "3.0.11",
    label: "Sistema Bibi - ServiceOS v3.0.11",
    date: "27/07/2026",
    status: "previous",
    summary:
      "Hotfix do faturamento operacional: Marcar paga passa a persistir corretamente no Blob após o COMMIT.",
    highlights: [
      {
        title: "Faturamento",
        items: [
          "Marcar paga (pagamento manual) deixa de reverter para FECHADA após reload em produção",
          "Flush do operation.db no Netlify Blob só após o COMMIT da transação",
          "Testes de regressão (unit + API + E2E) no fluxo Confirmar pagamento",
        ],
      },
    ],
    testStats: "CI unit+E2E · sqlite-transaction-flush · jornada marcar paga · docs:verify · pre-release OK",
  },
  {
    version: "3.0.10",
    label: "Sistema Bibi - ServiceOS v3.0.10",
    date: "27/07/2026",
    status: "previous",
    summary:
      "Mês operacional sempre atual na demo, suite completa da jornada do consultório e agenda sincronizada com Google/Outlook/Apple.",
    highlights: [
      {
        title: "Massa e testes",
        items: [
          "Seed de ~30 dias com walk-in, corporativo, autosserviço, descontos, PEP, estoque e timeline",
          "Suite Vitest + E2E alinhada à jornada do consultório (Atos 1–4)",
          "Launches CEDIG e despesas na janela do mês operacional",
        ],
      },
      {
        title: "Agenda e calendário",
        items: [
          "Integração ICS + OAuth Google/Microsoft com push da agenda",
          "Disponibilidade do prestador (grade de slots e bloqueios)",
          "Adicionar à agenda a partir do atendimento",
        ],
      },
    ],
    testStats: "CI unit+E2E · operation-month · jornada-consultorio · docs:verify · pre-release OK",
  },
  {
    version: "3.0.9",
    label: "Sistema Bibi - ServiceOS v3.0.9",
    date: "26/07/2026",
    status: "previous",
    summary:
      "Hotfix de fuso horário: agendas, slots e labels passam a usar America/Sao_Paulo de forma consistente em produção (UTC).",
    highlights: [
      {
        title: "Correção operacional",
        items: [
          "Utilitário central `timezone.ts` com fuso America/Sao_Paulo",
          "Agendamentos, slots, dashboards e seed deixam de adiantar ~3h em Netlify/UTC",
          "Dia civil BRT correto para filtros de agenda e “hoje” após 21h",
        ],
      },
    ],
    testStats: "timezone unit · CI unit+E2E · docs:verify · pre-release OK",
  },
  {
    version: "3.0.8",
    label: "Sistema Bibi - ServiceOS v3.0.8",
    date: "26/07/2026",
    status: "previous",
    summary:
      "Documentação operacional do consultório ponta a ponta e ferramentas para zerar fluxos de teste da CEDIG sem perder catálogo e equipe.",
    highlights: [
      {
        title: "Produto e operação",
        items: [
          "Jornada narrativa do consultório (chegada → atendimento → pagamento) com todas as ramificações",
          "Scripts para reset transacional CEDIG + republicação do operation.db nos Blobs",
          "Playbook e timeline CEDIG atualizados após limpeza em produção",
        ],
      },
      {
        title: "Documentação",
        items: [
          "Auditoria e inventário de páginas reconciliados",
          "Lacunas pós-v3.0.7 fechadas (setup, versão, OpenAPI)",
        ],
      },
    ],
    testStats: "598 testes Vitest · docs:verify · pre-release OK",
  },
  {
    version: "3.0.7",
    label: "Sistema Bibi - ServiceOS v3.0.7",
    date: "26/07/2026",
    status: "previous",
    summary:
      "Portais mais claros no mobile: menu pela direita, dashboard executivo com hierarquia e gestão clínica responsiva; relatórios em formatos canônicos.",
    highlights: [
      {
        title: "Navegação e dashboards",
        items: [
          "Drawer mobile abre pela direita, sem contagem de módulos e com categorias legíveis",
          "Dashboard executivo com KPIs prioritários e menos ruído visual",
          "Gestão clínica com layout responsivo no mobile",
        ],
      },
      {
        title: "Relatórios",
        items: [
          "Exports unificados em CSV/JSON/TXT/PDF canônicos nos portais",
          "BOM UTF-8 validado nos downloads tabulares",
        ],
      },
    ],
    testStats: "598 testes Vitest · E2E mobile-nav · docs:verify · pre-release OK",
  },
  {
    version: "3.0.6",
    label: "Sistema Bibi - ServiceOS v3.0.6",
    date: "26/07/2026",
    status: "previous",
    summary:
      "Home comercial alinhada à proposta Pay Per Use, navegação dos portais redesenhada no mobile e desktop, e assistente que fecha ao navegar.",
    highlights: [
      {
        title: "Home e captação",
        items: [
          "Funil comercial enxuto: dor → solução → como funciona → segmentos",
          "Copy focada em conectar empresa, prestador e cliente final",
          "Menu da home com 7 âncoras incluindo Como funciona",
        ],
      },
      {
        title: "Portais e assistente",
        items: [
          "Nav mobile/desktop redesenhada nos quatro portais (menu Mais, scroll)",
          "Assistente fecha automaticamente ao clicar em ação de navegação",
          "Documentação de APIs clínicas §7 e docRefs do flow map",
        ],
      },
    ],
    testStats: "587 testes Vitest · E2E · docs:verify · pre-release OK",
  },
  {
    version: "3.0.5",
    label: "Sistema Bibi - ServiceOS v3.0.5",
    date: "26/07/2026",
    status: "previous",
    summary:
      "Atendimento clínico mais completo para o prestador, jornada que acompanha o pagamento, e landing/portais mais limpos no desktop e no celular.",
    highlights: [
      {
        title: "Prontuário e Care Chart",
        items: [
          "Protocolos de exames editáveis e aplicáveis em lote no atendimento",
          "Atestado estruturado (CFM) e receita comum / controle especial com reativar",
          "Stepper do atendimento avança para Faturado/Pago quando a fatura está paga",
        ],
      },
      {
        title: "UX portais e landing",
        items: [
          "Abas do atendimento sem corte (scroll e rótulos curtos)",
          "Menu da home com 6 itens; marca do header só Sistema Bibi",
          "Header dos portais: Tour sem ?, sem faixa Powered by; badges ocultos no mobile",
        ],
      },
    ],
    testStats: "587 testes Vitest · docs:verify · pre-release OK",
  },
  {
    version: "3.0.4",
    label: "Sistema Bibi - ServiceOS v3.0.4",
    date: "26/07/2026",
    status: "previous",
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
