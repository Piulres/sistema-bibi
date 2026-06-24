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
    accentFrom: "#1e293b",
    accentTo: "#f97316",
    navActiveClass: "border-[var(--brand-accent)] text-[var(--brand-accent)]",
    navIdleClass:
      "border-transparent text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--brand-accent)]",
  },
  interno: {
    label: "Portal Interno",
    accentFrom: "#6366f1",
    accentTo: "#2563eb",
    navActiveClass: "border-[var(--portal-accent)] text-[var(--portal-accent)]",
    navIdleClass:
      "border-transparent text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--brand-accent)]",
  },
  pj: {
    label: "Portal da Empresa",
    accentFrom: "#d946ef",
    accentTo: "#9333ea",
    navActiveClass: "border-[var(--portal-accent)] text-[var(--portal-accent)]",
    navIdleClass:
      "border-transparent text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--brand-accent)]",
  },
  beneficiario: {
    label: "Portal do Beneficiário",
    accentFrom: "#1e293b",
    accentTo: "#f97316",
    navActiveClass: "border-[var(--brand-accent)] text-[var(--brand-accent)]",
    navIdleClass:
      "border-transparent text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--brand-accent)]",
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
