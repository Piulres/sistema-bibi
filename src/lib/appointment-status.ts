/**
 * Máquina de estados do Appointment (FLUXOS §10.1) — módulo puro, sem Prisma,
 * para uso tanto no servidor (rotas/serviços) quanto no cliente (views).
 *
 * Valores: AGENDADO | CONFIRMADO | REALIZADO | FALTOU | CANCELADO.
 * REALIZADO / FALTOU / CANCELADO são terminais (não saem para outro estado).
 * CANCELADO / FALTOU liberam o slot (scheduling-service).
 */

export const APPOINTMENT_STATUSES = [
  "AGENDADO",
  "CONFIRMADO",
  "REALIZADO",
  "FALTOU",
  "CANCELADO",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Estados terminais: uma vez atingidos, não transicionam para outro. */
export const TERMINAL_APPOINTMENT_STATUSES = ["REALIZADO", "FALTOU", "CANCELADO"] as const;

/**
 * Transições válidas a partir de cada estado. Estados terminais têm lista vazia.
 * AGENDADO → REALIZADO é permitido (prestador pode concluir sem confirmar presença).
 */
export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  AGENDADO: ["CONFIRMADO", "REALIZADO", "FALTOU", "CANCELADO"],
  CONFIRMADO: ["REALIZADO", "FALTOU", "CANCELADO"],
  REALIZADO: [],
  FALTOU: [],
  CANCELADO: [],
};

export function isAppointmentStatus(value: string): value is AppointmentStatus {
  return (APPOINTMENT_STATUSES as readonly string[]).includes(value);
}

export function isTerminalAppointmentStatus(value: string): boolean {
  return (TERMINAL_APPOINTMENT_STATUSES as readonly string[]).includes(value);
}

/**
 * Verifica se a transição `from → to` é permitida. Iguais são no-op (permitido).
 * Estados desconhecidos são rejeitados.
 */
export function canTransitionAppointmentStatus(from: string, to: string): boolean {
  if (!isAppointmentStatus(from) || !isAppointmentStatus(to)) return false;
  if (from === to) return true;
  return APPOINTMENT_TRANSITIONS[from].includes(to);
}

/**
 * Um procedimento (Pay Per Use) só pode ser registrado em um agendamento que
 * de fato ocorre ou está em andamento. Agendamentos que não aconteceram
 * (CANCELADO / FALTOU) não podem gerar cobrança nem consumir estoque.
 */
export function canRegisterProcedureForStatus(status: string): boolean {
  return status !== "CANCELADO" && status !== "FALTOU";
}
