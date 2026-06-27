import { PLATFORM } from "@/lib/platform";

export const LANDING_STATS = [
  { value: "~87%", label: "economia vs. plano fechado", suffix: "" },
  { value: "6", label: "segmentos na mesma plataforma", suffix: "" },
  { value: "4", label: "portais integrados", suffix: "" },
  { value: "Price Snapshot", label: "preço congelado no atendimento", suffix: "" },
] as const;

export const LANDING_TRUST_BADGES = [
  "Multi-tenant SaaS",
  PLATFORM.versionLabel,
  "API REST",
  "White label",
  "MFA TOTP",
] as const;

export function buildLandingDescription(tagline: string | null): string {
  return (
    tagline ??
    `${PLATFORM.name}: infraestrutura Pay Per Use para operações de serviços profissionais — quatro portais integrados, faturamento previsível e white label por tenant.`
  );
}
