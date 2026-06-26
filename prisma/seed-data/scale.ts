import { resolveSeedProfile } from "./profile";

/** Escala da massa de dados — controlada por SEED_SCALE no .env */
export type SeedScale = "small" | "medium" | "large" | "operation-1y";

export type ScaleConfig = {
  scale: SeedScale;
  /** Consultas geradas em seedOperationalMass (exclui fluxo demo) */
  appointmentCount: number;
  messageCount: number;
  /** Meses de cobrança recorrente (passado + futuro) */
  subscriptionChargeSpan: number;
  beneficiaryPortalUsers: number;
  /** Profundidade do histórico em dias */
  historyDays: number;
  /** Fechamento mensal corporativo (baseline de faturas B2B) */
  baselineMonths: number;
  /** Empresas no tenant VitaCare white-label */
  vitacareCompanies: number;
  /** Beneficiários por empresa ativa no VitaCare (média) */
  vitacareBeneficiariesPerCompany: number;
};

const PRESETS: Record<SeedScale, ScaleConfig> = {
  small: {
    scale: "small",
    appointmentCount: 40,
    messageCount: 18,
    subscriptionChargeSpan: 4,
    beneficiaryPortalUsers: 6,
    historyDays: 90,
    baselineMonths: 6,
    vitacareCompanies: 5,
    vitacareBeneficiariesPerCompany: 4,
  },
  medium: {
    scale: "medium",
    appointmentCount: 120,
    messageCount: 45,
    subscriptionChargeSpan: 6,
    beneficiaryPortalUsers: 12,
    historyDays: 180,
    baselineMonths: 6,
    vitacareCompanies: 8,
    vitacareBeneficiariesPerCompany: 6,
  },
  large: {
    scale: "large",
    appointmentCount: 280,
    messageCount: 90,
    subscriptionChargeSpan: 12,
    beneficiaryPortalUsers: 24,
    historyDays: 365,
    baselineMonths: 12,
    vitacareCompanies: 12,
    vitacareBeneficiariesPerCompany: 10,
  },
  "operation-1y": {
    scale: "operation-1y",
    appointmentCount: 320,
    messageCount: 96,
    subscriptionChargeSpan: 12,
    beneficiaryPortalUsers: 18,
    historyDays: 365,
    baselineMonths: 12,
    vitacareCompanies: 6,
    vitacareBeneficiariesPerCompany: 6,
  },
};

export function resolveSeedScale(): ScaleConfig {
  const profile = resolveSeedProfile();
  if (profile.profile === "operation-1y") {
    return PRESETS["operation-1y"];
  }

  const raw = (process.env.SEED_SCALE ?? "medium").toLowerCase();
  if (raw === "small" || raw === "medium" || raw === "large") {
    return PRESETS[raw];
  }
  if (raw === "operation-1y") {
    return PRESETS["operation-1y"];
  }
  console.warn(`SEED_SCALE="${raw}" invalido — usando medium`);
  return PRESETS.medium;
}
