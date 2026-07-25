import type { PortalKey } from "@/lib/roles";
import { PORTALS } from "@/lib/roles";
import { PORTAL_LOGIN_PATHS } from "@/lib/segment/login-demo";
import { appendSegmentToPath } from "@/lib/segment/types";

/** Portais selecionáveis na tela de login (ordem de apresentação). */
export const LOGIN_PORTAL_OPTIONS: { key: PortalKey; label: string }[] = [
  { key: "interno", label: PORTALS.interno.label },
  { key: "prestador", label: PORTALS.prestador.label },
  { key: "pj", label: PORTALS.pj.label },
  { key: "beneficiario", label: PORTALS.beneficiario.label },
];

/** Normaliza slug digitado: minúsculas, trim, só [a-z0-9-]. */
export function normalizeTenantSlug(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Monta href de login com portal + tenant opcional. */
export function buildLoginAccessHref(
  portal: PortalKey,
  tenantSlug?: string | null,
): string {
  const path = PORTAL_LOGIN_PATHS[portal];
  const slug = normalizeTenantSlug(tenantSlug ?? "");
  return appendSegmentToPath(path, { tenantSlug: slug || null });
}
