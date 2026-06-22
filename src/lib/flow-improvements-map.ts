/** Mapa canônico de melhorias de fluxo — fonte para Cadastros → Mapa de fluxos e documentação. */

export type FlowImprovementStatus = "implemented" | "partial" | "planned";

export type FlowImprovement = {
  id: string;
  portal: string;
  flow: string;
  title: string;
  description: string;
  status: FlowImprovementStatus;
  ui?: string;
  api?: string;
  docRef?: string;
};

export const FLOW_PORTALS = [
  "Todos",
  "Beneficiário",
  "Prestador",
  "Interno",
  "PJ",
  "Cross-portal",
] as const;

export type FlowPortalFilter = (typeof FLOW_PORTALS)[number];

export const FLOW_IMPROVEMENTS_MAP: FlowImprovement[] = [
  {
    id: "benef-cancel-appointment",
    portal: "Beneficiário",
    flow: "Agendamento",
    title: "Cancelar consulta agendada",
    description:
      "Beneficiário cancela consulta em status AGENDADO antes do horário; libera slot na agenda.",
    status: "implemented",
    ui: "/beneficiario → Minha agenda → Cancelar",
    api: "PATCH /api/beneficiario/appointments/[id] { action: cancel }",
    docRef: "FLUXOS.md §8.7",
  },
  {
    id: "benef-care-journey-stepper",
    portal: "Beneficiário",
    flow: "Jornada PPU",
    title: "Stepper da jornada clínica",
    description: "FlowStepper no resumo: Agendado → Confirmado → Atendido → Faturado → Pago.",
    status: "implemented",
    ui: "/beneficiario → Resumo",
    api: "GET /api/beneficiario/overview",
    docRef: "care-journey.ts",
  },
  {
    id: "benef-pix-qr",
    portal: "Beneficiário",
    flow: "Pagamento",
    title: "QR visual do PIX",
    description: "Exibição visual do código PIX (mock) além do copia-e-cola.",
    status: "implemented",
    ui: "/beneficiario → Faturas → Pagar com PIX",
    api: "POST /api/beneficiario/invoices/[id]/pay",
  },
  {
    id: "benef-appointment-cards",
    portal: "Beneficiário",
    flow: "Agendamento",
    title: "Cards de consulta na agenda",
    description: "Lista de consultas com AppointmentCard, status e ações contextuais.",
    status: "implemented",
    ui: "/beneficiario → Minha agenda",
  },
  {
    id: "prestador-confirm-arrival",
    portal: "Prestador",
    flow: "Atendimento",
    title: "Confirmar presença do paciente",
    description: "Prestador marca AGENDADO → CONFIRMADO na tela de atendimento.",
    status: "implemented",
    ui: "/prestador/atendimento/[id] → Paciente presente",
    api: "PATCH /api/prestador/appointments/[id] { status: CONFIRMADO }",
    docRef: "FLUXOS.md §8.7",
  },
  {
    id: "prestador-care-journey-stepper",
    portal: "Prestador",
    flow: "Atendimento",
    title: "Stepper PPU no atendimento",
    description: "Progresso visual da jornada clínica durante o atendimento.",
    status: "implemented",
    ui: "/prestador/atendimento/[id]",
    api: "GET /api/prestador/appointments/[id]",
  },
  {
    id: "interno-walkin",
    portal: "Interno",
    flow: "Walk-in particular",
    title: "Cadastro walk-in + agendamento imediato",
    description: "Paciente sem PJ cadastrado e agendado na recepção em um passo.",
    status: "implemented",
    ui: "/interno/agenda → Walk-in",
    api: "POST /api/interno/patients + POST /api/interno/appointments",
    docRef: "FLUXOS.md §8.5",
  },
  {
    id: "interno-checkin",
    portal: "Interno",
    flow: "Recepção",
    title: "Confirmar chegada na agenda",
    description: "Recepção confirma presença AGENDADO → CONFIRMADO no card do dia.",
    status: "implemented",
    ui: "/interno/agenda → Confirmar chegada",
    api: "PATCH /api/interno/appointments/[id]",
    docRef: "FLUXOS.md §8.5",
  },
  {
    id: "interno-crud-map",
    portal: "Interno",
    flow: "Operações",
    title: "Mapa CRUD exposto na UI",
    description: "27 entidades com rotas API, telas e tipo de exposição.",
    status: "implemented",
    ui: "/interno/cadastros?tab=operations",
    docRef: "FLUXOS.md §8.6",
  },
  {
    id: "cross-status-tracker",
    portal: "Cross-portal",
    flow: "Jornada PPU",
    title: "Rastreador unificado de status",
    description: "resolveCareJourneyStep() compartilhado entre portais para o mesmo modelo de passos.",
    status: "implemented",
    api: "src/lib/care-journey.ts",
    docRef: "JORNADA_CLIENTE.md §6",
  },
  {
    id: "cross-auto-confirm",
    portal: "Cross-portal",
    flow: "Agendamento",
    title: "Confirmação automática pós-agendamento",
    description: "Notificação e confirmação automática sem intervenção da recepção.",
    status: "planned",
    docRef: "JORNADA_CLIENTE.md §8",
  },
  {
    id: "pj-appointment-request",
    portal: "PJ",
    flow: "Agendamento",
    title: "Solicitação de consulta pelo RH",
    description: "RH agenda em nome de beneficiários da empresa.",
    status: "planned",
    ui: "/pj",
  },
  {
    id: "benef-reschedule",
    portal: "Beneficiário",
    flow: "Agendamento",
    title: "Reagendar consulta",
    description: "Trocar horário sem cancelar e criar novo agendamento.",
    status: "planned",
  },
  {
    id: "interno-rbac-hardening",
    portal: "Interno",
    flow: "Segurança",
    title: "RBAC em todas as APIs internas",
    description: "Alinhar requireInternoModule() em mutações além das páginas.",
    status: "partial",
    docRef: "AUDITORIA_FLUXOS.md §4",
  },
];

export function filterFlowImprovementsByPortal(portal: FlowPortalFilter): FlowImprovement[] {
  if (portal === "Todos") return FLOW_IMPROVEMENTS_MAP;
  return FLOW_IMPROVEMENTS_MAP.filter((item) => item.portal === portal);
}

export function countFlowByStatus(items: FlowImprovement[]) {
  return {
    implemented: items.filter((i) => i.status === "implemented").length,
    partial: items.filter((i) => i.status === "partial").length,
    planned: items.filter((i) => i.status === "planned").length,
  };
}
