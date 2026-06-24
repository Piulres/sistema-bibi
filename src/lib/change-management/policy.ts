/** Políticas de reversibilidade por entidade (R0–R5). */

export type ReversibilityClass = "R0" | "R1" | "R2" | "R3" | "R4" | "R5";

export const ENTITY_REVERSIBILITY: Record<string, ReversibilityClass> = {
  Patient: "R2",
  Company: "R2",
  Procedure: "R2",
  PricingRule: "R2",
  Branding: "R2",
  Appointment: "R4",
  ProcedureUsage: "R3",
  Invoice: "R3",
  Payment: "R5",
  StockMovement: "R3",
  MedicalRecord: "R2",
  MedicationPrescription: "R4",
  ExamOrder: "R4",
  User: "R2",
};

export function getReversibilityClass(entityType: string): ReversibilityClass {
  return ENTITY_REVERSIBILITY[entityType] ?? "R5";
}

export function isRestorableEntity(entityType: string): boolean {
  const cls = getReversibilityClass(entityType);
  return cls === "R1" || cls === "R2";
}

/** Janela para revert-recent (ms). */
export function getRestoreWindowMs(): number {
  const raw = process.env.CHANGE_RESTORE_WINDOW_MS;
  const parsed = raw ? Number(raw) : 5 * 60_000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5 * 60_000;
}

export function restoreRequiresConfirmPhrase(): boolean {
  return process.env.CHANGE_RESTORE_REQUIRES_CONFIRM !== "false";
}

export const RESTORE_CONFIRM_PHRASE = "RESTAURAR";
