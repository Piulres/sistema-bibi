/**
 * Catálogo de feedback UX — mapeamento canônico por camada.
 * Referência para views e agentes; espelha DESIGN_SYSTEM § Componentes auxiliares.
 */

export type FeedbackLayer = "navigation" | "data-load" | "mutation" | "partial";

export type ViewFeedbackEntry = {
  view: string;
  portal: "interno" | "prestador" | "pj" | "beneficiario" | "landing";
  layers: FeedbackLayer[];
  loadingMessage?: string;
  destructiveActions?: string[];
  notes?: string;
};

/** Views autenticadas e padrão de feedback aplicado (pós-pacote feedback UX). */
export const VIEW_FEEDBACK_MAP: ViewFeedbackEntry[] = [
  // Interno
  { view: "CadastrosView", portal: "interno", layers: ["data-load", "mutation"], loadingMessage: "Carregando cadastros...", destructiveActions: ["deleteProcedure", "deletePricingRule"] },
  { view: "BillingView", portal: "interno", layers: ["data-load", "mutation"], loadingMessage: "Carregando faturamento...", destructiveActions: ["markPaid", "confirmPix"] },
  { view: "AppointmentsView", portal: "interno", layers: ["data-load", "mutation"], loadingMessage: "Carregando agenda...", destructiveActions: ["cancelAppointment"] },
  { view: "AgendaView", portal: "interno", layers: ["data-load"], loadingMessage: "Carregando agenda..." },
  { view: "AuditoriaView", portal: "interno", layers: ["data-load", "mutation"], loadingMessage: "Carregando auditoria...", destructiveActions: ["restoreAudit"] },
  { view: "StockView", portal: "interno", layers: ["data-load", "mutation"], loadingMessage: "Carregando estoque..." },
  { view: "IntegracoesView", portal: "interno", layers: ["data-load", "mutation"], loadingMessage: "Carregando integrações...", destructiveActions: ["deleteWebhook"] },
  { view: "ComunicacaoView", portal: "interno", layers: ["data-load", "mutation"], loadingMessage: "Carregando comunicações...", destructiveActions: ["cancelMessage"] },
  { view: "SubscriptionsView", portal: "interno", layers: ["data-load", "mutation"], loadingMessage: "Carregando assinaturas...", destructiveActions: ["cancelSubscription"] },
  { view: "SecurityView", portal: "interno", layers: ["data-load", "mutation"], loadingMessage: "Carregando segurança...", destructiveActions: ["disableMfa"] },
  { view: "BrandingView", portal: "interno", layers: ["data-load", "mutation"], loadingMessage: "Carregando identidade visual..." },
  { view: "CrmPipelineView", portal: "interno", layers: ["data-load", "mutation"], loadingMessage: "Carregando pipeline..." },
  { view: "ExecutiveDashboardView", portal: "interno", layers: ["data-load"], loadingMessage: "Carregando indicadores..." },
  { view: "PatientOverviewView", portal: "interno", layers: ["data-load"], loadingMessage: "Carregando Cliente 360°..." },
  { view: "DemoResetCard", portal: "interno", layers: ["data-load", "mutation"], destructiveActions: ["demoReset"] },
  { view: "DataStoreCard", portal: "interno", layers: ["data-load", "mutation"], destructiveActions: ["switchDataStore"] },
  // Prestador
  { view: "AtendimentoView", portal: "prestador", layers: ["data-load", "mutation", "partial"], loadingMessage: "Carregando atendimento...", notes: "clinicalLoading na sidebar" },
  { view: "PrestadorDashboardView", portal: "prestador", layers: ["data-load"], loadingMessage: "Carregando indicadores..." },
  { view: "PrestadorPatientsView", portal: "prestador", layers: ["data-load"], loadingMessage: "Carregando pacientes..." },
  { view: "PrestadorPatientHistoryView", portal: "prestador", layers: ["data-load"], loadingMessage: "Carregando histórico..." },
  { view: "PrestadorExtratoView", portal: "prestador", layers: ["data-load"], loadingMessage: "Carregando extrato..." },
  // PJ / Beneficiário
  { view: "PjView", portal: "pj", layers: ["data-load"], loadingMessage: "Carregando dados da empresa..." },
  { view: "BeneficiarioView", portal: "beneficiario", layers: ["data-load", "mutation"], loadingMessage: "Carregando seu painel...", destructiveActions: ["cancelAppointment", "confirmPix"] },
];

export const FEEDBACK_PRIMITIVES = {
  loading: "LoadingState / ViewStateBoundary",
  error: "ViewStateBoundary + Alert danger + retry",
  success: "Toast tone=success",
  errorToast: "Toast tone=danger (via useAsyncAction.run)",
  confirm: "ConfirmDialog via useConfirm / confirmPresets",
  navigation: "NavigationProgress + loading.tsx",
  undo: "Toast actionLabel + useFormUndo / useDraftUndo / revert-recent API",
} as const;
