import type { PortalKey } from "@/lib/roles";
import type { BrandingTokens } from "@/lib/theme/tokens";

/** Rótulos dos quatro portais autenticados. */
export const PORTAL_LABELS: Record<PortalKey, string> = {
  prestador: "Portal do Prestador",
  interno: "Portal Interno",
  pj: "Portal da Empresa",
  beneficiario: "Portal do Beneficiário",
};

/** Classes de navegação unificadas — acentos vêm do branding do tenant via CSS vars. */
export const PORTAL_NAV_ACTIVE_CLASS =
  "border-[var(--brand-accent)] text-[var(--brand-accent)]";

export const PORTAL_NAV_IDLE_CLASS =
  "border-transparent text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--brand-accent)]";

export const PORTAL_MOBILE_ACTIVE_CLASS =
  "bg-[var(--surface-muted)] text-[var(--brand-accent)]";

/**
 * CSS variables de acento do portal — derivadas do branding do tenant/segmento.
 * Dentro dos portais, `--portal-accent` espelha `--brand-accent` do tenant ativo.
 */
export function portalAccentCssVars(
  branding: Pick<BrandingTokens, "primaryColor" | "accentColor" | "heroFrom" | "heroTo">,
): Record<string, string> {
  return {
    "--portal-accent-from": branding.heroFrom,
    "--portal-accent-to": branding.heroTo,
    "--portal-accent": branding.accentColor,
  };
}

/** @deprecated Prefer `PORTAL_LABELS` + classes exportadas. Mantido para compatibilidade. */
export const PORTAL_THEMES: Record<
  PortalKey,
  {
    label: string;
    navActiveClass: string;
    navIdleClass: string;
  }
> = {
  prestador: {
    label: PORTAL_LABELS.prestador,
    navActiveClass: PORTAL_NAV_ACTIVE_CLASS,
    navIdleClass: PORTAL_NAV_IDLE_CLASS,
  },
  interno: {
    label: PORTAL_LABELS.interno,
    navActiveClass: PORTAL_NAV_ACTIVE_CLASS,
    navIdleClass: PORTAL_NAV_IDLE_CLASS,
  },
  pj: {
    label: PORTAL_LABELS.pj,
    navActiveClass: PORTAL_NAV_ACTIVE_CLASS,
    navIdleClass: PORTAL_NAV_IDLE_CLASS,
  },
  beneficiario: {
    label: PORTAL_LABELS.beneficiario,
    navActiveClass: PORTAL_NAV_ACTIVE_CLASS,
    navIdleClass: PORTAL_NAV_IDLE_CLASS,
  },
};
