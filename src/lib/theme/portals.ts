import type { PortalKey } from "@/lib/roles";

/** Acentos visuais por portal — complementam o branding do tenant. */
export const PORTAL_THEMES: Record<
  PortalKey,
  {
    label: string;
    accentFrom: string;
    accentTo: string;
    navActiveClass: string;
    navIdleClass: string;
  }
> = {
  prestador: {
    label: "Portal do Prestador",
    accentFrom: "#14b8a6",
    accentTo: "#059669",
    navActiveClass: "border-[var(--brand-primary)] text-[var(--brand-primary)]",
    navIdleClass: "border-transparent text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]",
  },
  interno: {
    label: "Portal Interno",
    accentFrom: "#6366f1",
    accentTo: "#2563eb",
    navActiveClass: "border-[var(--portal-accent)] text-[var(--portal-accent)]",
    navIdleClass: "border-transparent text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]",
  },
  pj: {
    label: "Portal da Empresa",
    accentFrom: "#d946ef",
    accentTo: "#9333ea",
    navActiveClass: "border-[var(--portal-accent)] text-[var(--portal-accent)]",
    navIdleClass: "border-transparent text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]",
  },
  beneficiario: {
    label: "Portal do Beneficiário",
    accentFrom: "#14b8a6",
    accentTo: "#0891b2",
    navActiveClass: "border-[var(--brand-primary)] text-[var(--brand-primary)]",
    navIdleClass: "border-transparent text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]",
  },
};

/** CSS variables de acento do portal (sobrescreve --portal-accent no contexto). */
export function portalAccentCssVars(portal: PortalKey): Record<string, string> {
  const theme = PORTAL_THEMES[portal];
  return {
    "--portal-accent-from": theme.accentFrom,
    "--portal-accent-to": theme.accentTo,
    "--portal-accent": theme.accentFrom,
  };
}
