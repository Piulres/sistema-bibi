/** Mapa canônico das operações CRUD — fonte para Cadastros → Mapa CRUD e documentação. */

export type CrudExposure = "ui" | "api-only" | "cron" | "download";

export type CrudOperationDetail = {
  label: string;
  ui?: string;
  api?: string;
  exposure: CrudExposure;
};

export type CrudEntityMap = {
  entity: string;
  portal: string;
  description?: string;
  create: CrudOperationDetail[];
  read: CrudOperationDetail[];
  update: CrudOperationDetail[];
  delete: CrudOperationDetail[];
};

function ui(
  label: string,
  uiPath: string,
  api?: string,
  exposure: CrudExposure = "ui",
): CrudOperationDetail {
  return { label, ui: uiPath, api, exposure };
}

function apiOnly(label: string, api: string, exposure: CrudExposure = "api-only"): CrudOperationDetail {
  return { label, api, exposure };
}

function download(label: string, uiPath: string, api: string): CrudOperationDetail {
  return { label, ui: uiPath, api, exposure: "download" };
}

function cron(label: string, api: string, uiTwin?: string): CrudOperationDetail {
  return { label, api, ui: uiTwin, exposure: "cron" };
}

const none: CrudOperationDetail[] = [{ label: "—", exposure: "ui" }];

export const CRUD_PORTALS = [
  "Todos",
  "Interno",
  "Prestador",
  "Beneficiário",
  "PJ",
  "Auth",
  "Sistema",
] as const;

export type CrudPortalFilter = (typeof CRUD_PORTALS)[number];

/** Entidades ordenadas por portal e domínio de negócio. */
export const CRUD_OPERATIONS_MAP: CrudEntityMap[] = [
  // —— Interno: cadastros e operação ——
  {
    entity: "Beneficiário / paciente",
    portal: "Interno",
    description: "Pacientes com ou sem empresa PJ (companyId null = particular).",
    create: [
      ui("Cadastrar beneficiário", "/interno/cadastros → Beneficiários", "POST /api/interno/patients"),
      ui("Walk-in particular", "/interno/agenda → walk-in", "POST /api/interno/patients"),
    ],
    read: [
      ui("Listar cadastros", "/interno/cadastros", "GET /api/interno/patients"),
      ui("Cliente 360°", "/interno/beneficiarios/[id]", "GET /api/interno/patients/[id]/overview"),
      ui("Agenda do dia", "/interno/agenda", "GET /api/interno/appointments?date="),
      download("Export LGPD JSON", "/interno/beneficiarios/[id]", "GET /api/interno/patients/[id]/export"),
    ],
    update: [ui("Editar cadastro", "/interno/cadastros → Editar", "PATCH /api/interno/patients/[id]")],
    delete: [{ label: "— (auditoria; sem exclusão na POC)", exposure: "ui" }],
  },
  {
    entity: "Empresa (PJ)",
    portal: "Interno",
    description: "Clientes corporativos e pipeline comercial.",
    create: [ui("Nova empresa", "/interno/cadastros → Empresas", "POST /api/interno/companies")],
    read: [
      ui("Listar empresas", "/interno/cadastros", "GET /api/interno/companies"),
      ui("Pipeline CRM", "/interno/crm", "GET /api/interno/crm/pipeline"),
    ],
    update: [
      ui("Editar cadastro", "/interno/cadastros → Editar", "PATCH /api/interno/companies/[id]"),
      ui("Mover no pipeline", "/interno/crm → status", "PATCH /api/interno/companies/[id]/status"),
    ],
    delete: none,
  },
  {
    entity: "Procedimento (catálogo)",
    portal: "Interno",
    create: [ui("Novo procedimento", "/interno/cadastros → Procedimentos", "POST /api/interno/procedures")],
    read: [
      ui("Catálogo interno", "/interno/cadastros", "GET /api/interno/procedures"),
      ui("Catálogo prestador", "/prestador/atendimento/[id]", "GET /api/procedures"),
    ],
    update: [ui("Editar", "/interno/cadastros → Editar", "PUT /api/interno/procedures/[id]")],
    delete: [ui("Excluir", "/interno/cadastros", "DELETE /api/interno/procedures/[id]")],
  },
  {
    entity: "Usuário",
    portal: "Interno",
    create: [
      ui("Criar usuário", "/interno/cadastros → Usuários", "POST /api/interno/users"),
      ui("Portal walk-in (opcional)", "/interno/agenda → walk-in", "POST /api/interno/users"),
    ],
    read: [ui("Listar usuários", "/interno/cadastros", "GET /api/interno/users")],
    update: [ui("Editar", "/interno/cadastros → Editar", "PATCH /api/interno/users/[id]")],
    delete: none,
  },
  {
    entity: "Agendamento",
    portal: "Interno",
    create: [
      ui("Agendar (cadastrado)", "/interno/agenda", "POST /api/interno/appointments"),
      ui("Walk-in + agendar", "/interno/agenda → walk-in", "POST /api/interno/appointments"),
    ],
    read: [ui("Agenda do dia", "/interno/agenda", "GET /api/interno/appointments?date=")],
    update: [
      ui("Check-in / status", "/interno/agenda", "PATCH /api/interno/appointments/[id]"),
    ],
    delete: [{ label: "Cancelado via status CANCELADO", ui: "/interno/agenda", exposure: "ui" }],
  },
  {
    entity: "Fatura Pay Per Use",
    portal: "Interno",
    create: [ui("Gerar fatura", "/interno → Faturamento", "POST /api/interno/invoices")],
    read: [
      ui("Pendências e emitidas", "/interno", "GET /api/interno/billing"),
      ui("Cliente 360°", "/interno/beneficiarios/[id]", "GET …/patients/[id]/overview"),
    ],
    update: [ui("Marcar paga (manual)", "/interno", "POST /api/interno/invoices/[id]/pay")],
    delete: none,
  },
  {
    entity: "Pagamento PIX",
    portal: "Interno",
    description: "Cobrança mock vinculada à fatura.",
    create: [ui("Gerar PIX", "/interno → PIX", "POST /api/interno/invoices/[id]/pix")],
    read: [{ label: "— (estado na fatura)", exposure: "ui" }],
    update: [
      ui("Confirmar PIX", "/interno", "POST /api/interno/invoices/[id]/confirm-pix"),
    ],
    delete: none,
  },
  {
    entity: "Assinatura recorrente",
    portal: "Interno",
    create: [ui("Criar assinatura", "/interno/assinaturas", "POST /api/interno/subscriptions")],
    read: [ui("Listar assinaturas", "/interno/assinaturas", "GET /api/interno/subscriptions")],
    update: [
      ui("Alterar status", "/interno/assinaturas", "PATCH /api/interno/subscriptions/[id]"),
      ui("Gerar cobranças", "/interno/assinaturas", "POST …/subscriptions/[id]/generate-charges"),
    ],
    delete: none,
  },
  {
    entity: "Cobrança de assinatura",
    portal: "Interno",
    description: "Parcelas geradas a partir da assinatura.",
    create: [
      ui("Faturar cobrança", "/interno/assinaturas → Faturar", "POST …/charges/[chargeId]/invoice"),
    ],
    read: [
      ui("Ver cobranças", "/interno/assinaturas", "GET …/subscriptions/[id]/charges"),
    ],
    update: [{ label: "— (via fatura vinculada)", exposure: "ui" }],
    delete: none,
  },
  {
    entity: "Mensagem / campanha",
    portal: "Interno",
    create: [
      ui("Enfileirar mensagem", "/interno/comunicacao", "POST /api/interno/messages"),
    ],
    read: [
      ui("Fila de mensagens", "/interno/comunicacao", "GET /api/interno/messages"),
      ui("Preview template", "/interno/comunicacao", "GET /api/interno/messages/template"),
    ],
    update: [
      ui("Despachar", "/interno/comunicacao", "POST …/messages/[id]/dispatch"),
      ui("Cancelar", "/interno/comunicacao", "PATCH …/messages/[id]"),
    ],
    delete: none,
  },
  {
    entity: "Lembretes automáticos",
    portal: "Interno",
    description: "Enfileira mensagens por regras (consulta, assinatura, PPU).",
    create: [
      ui("Gerar lembretes", "/interno/comunicacao", "POST /api/interno/reminders"),
      cron("Job agendado", "POST /api/cron/reminders", "/interno/comunicacao"),
    ],
    read: [{ label: "— (vira mensagem na fila)", exposure: "ui" }],
    update: none,
    delete: none,
  },
  {
    entity: "Webhook B2B",
    portal: "Interno",
    create: [ui("Adicionar webhook", "/interno/integracoes", "POST /api/interno/webhooks")],
    read: [ui("Listar endpoints", "/interno/integracoes", "GET /api/interno/webhooks")],
    update: [
      ui("Ativar / pausar", "/interno/integracoes", "PATCH /api/interno/webhooks/[id]"),
    ],
    delete: [ui("Excluir", "/interno/integracoes", "DELETE /api/interno/webhooks/[id]")],
  },
  {
    entity: "Entrega de webhook",
    portal: "Interno",
    create: [{ label: "— (disparo automático)", exposure: "ui" }],
    read: [
      ui("Log de entregas", "/interno/integracoes", "GET /api/interno/webhooks/deliveries"),
    ],
    update: [
      ui("Reenviar", "/interno/integracoes", "POST …/deliveries/[id]/retry"),
      cron("Retry automático", "POST /api/cron/webhooks"),
    ],
    delete: none,
  },
  {
    entity: "Branding white label",
    portal: "Interno",
    create: [
      ui("Upsert identidade", "/interno/branding", "PUT /api/interno/branding"),
    ],
    read: [
      ui("Configuração atual", "/interno/branding", "GET /api/interno/branding"),
      apiOnly("Logo público", "GET /api/branding/logo/[tenantId]"),
    ],
    update: [
      ui("Salvar identidade visual", "/interno/branding", "PUT /api/interno/branding"),
      ui("Upload logo", "/interno/branding", "POST /api/interno/branding/logo"),
      ui("Verificar domínio", "/interno/branding", "PUT /api/interno/branding"),
    ],
    delete: none,
  },
  {
    entity: "Relatórios e exportações",
    portal: "Interno",
    create: none,
    read: [
      download("CSV faturamento", "/interno/relatorios", "GET /api/interno/reports?type=billing"),
      download("CSV CRM", "/interno/relatorios", "GET /api/interno/reports?type=crm"),
      download("XML TISS", "/interno → Faturamento", "GET /api/interno/invoices/[id]/tiss"),
    ],
    update: none,
    delete: none,
  },
  {
    entity: "Dashboard executivo",
    portal: "Interno",
    create: none,
    read: [ui("KPIs e receita", "/interno/dashboard", "GET /api/interno/dashboard")],
    update: none,
    delete: none,
  },
  {
    entity: "MFA (TOTP)",
    portal: "Interno",
    create: [
      ui("Configurar MFA", "/interno/seguranca", "POST /api/auth/mfa/setup { action: setup }"),
    ],
    read: [ui("Status MFA", "/interno/seguranca", "GET /api/auth/mfa/setup")],
    update: [
      ui("Ativar MFA", "/interno/seguranca", "POST /api/auth/mfa/setup { action: enable }"),
      ui("Desativar MFA", "/interno/seguranca", "POST /api/auth/mfa/setup { action: disable }"),
      ui("Verificar no login", "*/login (etapa MFA)", "POST /api/auth/mfa/verify"),
    ],
    delete: none,
  },
  {
    entity: "Reset modo demo",
    portal: "Interno",
    create: [
      ui("Restaurar seed", "/interno/seguranca", "POST /api/interno/demo/reset"),
    ],
    read: [ui("Status do reset", "/interno/seguranca", "GET /api/interno/demo/reset")],
    update: none,
    delete: none,
  },

  // —— Prestador ——
  {
    entity: "Agendamento (prestador)",
    portal: "Prestador",
    create: none,
    read: [
      ui("Agenda do dia", "/prestador", "GET /api/prestador/agenda"),
      ui("Detalhe atendimento", "/prestador/atendimento/[id]", "GET …/prestador/appointments/[id]"),
    ],
    update: [
      ui("Marcar realizado", "/prestador/atendimento/[id]", "PATCH …/prestador/appointments/[id]"),
    ],
    delete: none,
  },
  {
    entity: "Uso de procedimento (PPU)",
    portal: "Prestador",
    description: "ProcedureUsage com preço congelado (Pay Per Use).",
    create: [
      ui("Registrar procedimento", "/prestador/atendimento/[id]", "POST …/appointments/[id]/procedures"),
    ],
    read: [ui("Lista no atendimento", "/prestador/atendimento/[id]", "GET …/prestador/appointments/[id]")],
    update: none,
    delete: none,
  },
  {
    entity: "Prontuário (PEP)",
    portal: "Prestador",
    create: [
      ui("Salvar no prontuário", "/prestador/atendimento/[id]", "POST /api/prestador/records"),
    ],
    read: [
      ui("Registros do atendimento", "/prestador/atendimento/[id]", "GET …/prestador/appointments/[id]"),
      ui("Cliente 360°", "/interno/beneficiarios/[id]", "GET …/patients/[id]/overview"),
    ],
    update: none,
    delete: none,
  },

  // —— Beneficiário ——
  {
    entity: "Agendamento (self-service)",
    portal: "Beneficiário",
    create: [ui("Agendar consulta", "/beneficiario", "POST /api/beneficiario/appointments")],
    read: [
      ui("Visão geral", "/beneficiario", "GET /api/beneficiario/overview"),
      ui("Prestadores", "/beneficiario → Agendar", "GET /api/beneficiario/providers"),
      ui("Horários livres", "/beneficiario → Agendar", "GET /api/beneficiario/slots"),
    ],
    update: none,
    delete: none,
  },
  {
    entity: "Pagamento PIX (beneficiário)",
    portal: "Beneficiário",
    create: [ui("Pagar com PIX", "/beneficiario → Faturas", "POST …/beneficiario/invoices/[id]/pay")],
    read: [{ label: "— (código na resposta)", exposure: "ui" }],
    update: [
      ui("Confirmar PIX", "/beneficiario", "PATCH …/beneficiario/invoices/[id]/pay"),
    ],
    delete: none,
  },

  // —— PJ ——
  {
    entity: "Visão corporativa",
    portal: "PJ",
    description: "Somente leitura — escopo da empresa logada.",
    create: none,
    read: [ui("Painel TechCorp", "/pj", "GET /api/pj/overview")],
    update: none,
    delete: none,
  },
  {
    entity: "Relatório corporativo",
    portal: "PJ",
    create: none,
    read: [download("Exportar CSV", "/pj", "GET /api/pj/reports")],
    update: none,
    delete: none,
  },

  // —— Auth / sistema ——
  {
    entity: "Autenticação",
    portal: "Auth",
    create: [
      ui("Login", "*/login", "POST /api/auth/login"),
      ui("Logout", "PortalHeader", "POST /api/auth/logout"),
    ],
    read: [apiOnly("Sessão atual", "GET /api/auth/me")],
    update: none,
    delete: none,
  },
];

/** Contagem rápida para dashboards e testes. */
export function crudMapStats() {
  let uiOps = 0;
  let apiOnlyOps = 0;
  for (const row of CRUD_OPERATIONS_MAP) {
    for (const bucket of [row.create, row.read, row.update, row.delete]) {
      for (const op of bucket) {
        if (op.exposure === "api-only" || op.exposure === "cron") apiOnlyOps += 1;
        else if (op.label !== "—" && !op.label.startsWith("—")) uiOps += 1;
      }
    }
  }
  return {
    entities: CRUD_OPERATIONS_MAP.length,
    uiOperations: uiOps,
    apiOrCronOnly: apiOnlyOps,
  };
}

/** Filtra entidades por portal (Todos = sem filtro). */
export function filterCrudMapByPortal(portal: CrudPortalFilter): CrudEntityMap[] {
  if (portal === "Todos") return CRUD_OPERATIONS_MAP;
  return CRUD_OPERATIONS_MAP.filter((row) => row.portal === portal);
}
