import { PLATFORM } from "@/lib/platform";

export const LANDING_STATS = [
  { value: "4", label: "portais integrados", suffix: "" },
  { value: "Pay Per Use", label: "cobrança por uso real", suffix: "" },
  { value: "100%", label: "nuvem e multi-tenant", suffix: "" },
  { value: "LGPD", label: "conformidade nativa", suffix: "" },
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
