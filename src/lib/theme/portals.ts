import type { PortalKey } from "@/lib/roles";
import type { BrandingTokens } from "@/lib/theme/tokens";

/** Rótulos dos quatro portais autenticados. */
export const PORTAL_LABELS: Record<PortalKey, string> = {
  prestador: "Portal do Prestador",
  interno: "Portal Interno",
  pj: "Portal da Empresa",
  beneficiario: "Portal do Beneficiário",
};

/** Classes de navegação — pills com acento do tenant via CSS vars. */
export const PORTAL_NAV_ACTIVE_CLASS =
  "bg-[var(--brand-accent)] text-white shadow-sm";

export const PORTAL_NAV_IDLE_CLASS =
  "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]";

export const PORTAL_MOBILE_ACTIVE_CLASS =
  "bg-[var(--surface-muted)] text-[var(--brand-accent)]";

/** CSS variables de acento — derivadas do whitelabel do tenant ativo. */
export function portalAccentCssVars(
  branding: Pick<BrandingTokens, "primaryColor" | "accentColor" | "heroFrom" | "heroTo">,
): Record<string, string> {
  return {
    "--portal-accent-from": branding.heroFrom,
    "--portal-accent-to": branding.heroTo,
    "--portal-accent": branding.accentColor,
  };
}

/** @deprecated Prefer `PORTAL_LABELS` + classes exportadas. */
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
