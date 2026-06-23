import type { NicheId } from "@/lib/niche/types";
import { getNicheConfig } from "@/lib/niche/defaults";
import { NICHE_IDS } from "@/lib/niche/types";

export type SegmentTenantRef = {
  niche: NicheId;
  slug: string;
  tenant: string;
  internoEmail: string;
  providerEmail: string;
};

/** Referência canônica dos tenants demo por segmento (espelha o seed). */
export const SEGMENT_TENANTS: SegmentTenantRef[] = [
  {
    niche: "MEDICAL",
    slug: "horizonte",
    tenant: "Clínica Horizonte",
    internoEmail: "faturamento@bibi.health",
    providerEmail: "dra.helena@bibi.health",
  },
  {
    niche: "VET",
    slug: "petcare",
    tenant: "PetCare",
    internoEmail: "operacao@petcare.demo",
    providerEmail: "dr.rafael@petcare.demo",
  },
  {
    niche: "DENTAL",
    slug: "smile",
    tenant: "Smile Odonto",
    internoEmail: "operacao@smile.demo",
    providerEmail: "dra.camila@smile.demo",
  },
  {
    niche: "LEGAL",
    slug: "lex",
    tenant: "Lex & Partners",
    internoEmail: "operacao@lex.demo",
    providerEmail: "dr.andre@lex.demo",
  },
  {
    niche: "SPA",
    slug: "zen",
    tenant: "Zen Studio",
    internoEmail: "operacao@zen.demo",
    providerEmail: "instrutora.lia@zen.demo",
  },
  {
    niche: "EDUCATION",
    slug: "eduprime",
    tenant: "EduPrime",
    internoEmail: "operacao@eduprime.demo",
    providerEmail: "prof.marcos@eduprime.demo",
  },
];

export const SEGMENT_SLUG_BY_NICHE = Object.fromEntries(
  SEGMENT_TENANTS.map((t) => [t.niche, t.slug]),
) as Record<NicheId, string>;

/** @deprecated Use SEGMENT_TENANTS */
export type NicheDemoAccount = Pick<SegmentTenantRef, "niche" | "tenant" | "internoEmail">;

/** @deprecated Use SEGMENT_TENANTS */
export const NICHE_INTERNO_DEMOS: NicheDemoAccount[] = SEGMENT_TENANTS.map(
  ({ niche, tenant, internoEmail }) => ({ niche, tenant, internoEmail }),
);

export function nicheDemoLabel(niche: NicheId): string {
  return getNicheConfig(niche).name;
}

export function segmentTenantBySlug(slug: string): SegmentTenantRef | undefined {
  return SEGMENT_TENANTS.find((t) => t.slug === slug.toLowerCase());
}

export function segmentTenantByNiche(niche: NicheId): SegmentTenantRef {
  return SEGMENT_TENANTS.find((t) => t.niche === niche) ?? SEGMENT_TENANTS[0];
}

export function allSegmentNiches(): NicheId[] {
  return [...NICHE_IDS];
}
