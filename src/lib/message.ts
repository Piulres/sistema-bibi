import { formatBRL } from "@/lib/pricing";

export const COMMUNICATION_CHANNELS = [
  { value: "EMAIL", label: "E-mail" },
  { value: "SMS", label: "SMS" },
  { value: "WHATSAPP", label: "WhatsApp" },
] as const;

export const MESSAGE_TEMPLATES = [
  { value: "APPOINTMENT_REMINDER", label: "Lembrete de consulta" },
  { value: "INVOICE_DUE", label: "Fatura pendente" },
  { value: "SUBSCRIPTION_DUE", label: "Cobrança recorrente" },
  { value: "GENERIC", label: "Mensagem livre" },
] as const;

export const MESSAGE_STATUSES = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "FALHA", label: "Falha" },
  { value: "CANCELADA", label: "Cancelada" },
] as const;

const CHANNEL_SET = new Set<string>(COMMUNICATION_CHANNELS.map((c) => c.value));
const TEMPLATE_SET = new Set<string>(MESSAGE_TEMPLATES.map((t) => t.value));
const STATUS_SET = new Set<string>(MESSAGE_STATUSES.map((s) => s.value));

export function isCommunicationChannel(value: string): value is (typeof COMMUNICATION_CHANNELS)[number]["value"] {
  return CHANNEL_SET.has(value);
}

export function isMessageTemplate(value: string): value is (typeof MESSAGE_TEMPLATES)[number]["value"] {
  return TEMPLATE_SET.has(value);
}

export function isMessageStatus(value: string): value is (typeof MESSAGE_STATUSES)[number]["value"] {
  return STATUS_SET.has(value);
}

export function channelLabel(channel: string): string {
  return COMMUNICATION_CHANNELS.find((c) => c.value === channel)?.label ?? channel;
}

export function templateLabel(template: string): string {
  return MESSAGE_TEMPLATES.find((t) => t.value === template)?.label ?? template;
}

export function messageStatusLabel(status: string): string {
  return MESSAGE_STATUSES.find((s) => s.value === status)?.label ?? status;
}

/** Gera corpo padrao para templates conhecidos (POC). */
export function buildTemplateBody(input: {
  template: string;
  patientName: string;
  amountLabel?: string;
  appointmentDateLabel?: string;
}): { subject: string | null; body: string } {
  switch (input.template) {
    case "APPOINTMENT_REMINDER":
      return {
        subject: "Lembrete de consulta — Bibi Saúde",
        body: `Olá ${input.patientName}, lembramos sua consulta agendada para ${input.appointmentDateLabel ?? "em breve"}. Em caso de impossibilidade, entre em contato conosco.`,
      };
    case "INVOICE_DUE":
      return {
        subject: "Fatura pendente — Bibi Saúde",
        body: `Olá ${input.patientName}, você possui procedimentos pendentes de faturamento no valor de ${input.amountLabel ?? formatBRL(0)}. Acesse o portal do beneficiário para detalhes.`,
      };
    case "SUBSCRIPTION_DUE":
      return {
        subject: "Cobrança recorrente — Bibi Saúde",
        body: `Olá ${input.patientName}, sua assinatura possui cobrança pendente de ${input.amountLabel ?? formatBRL(0)}. Regularize para manter o plano ativo.`,
      };
    default:
      return {
        subject: null,
        body: `Olá ${input.patientName},`,
      };
  }
}
