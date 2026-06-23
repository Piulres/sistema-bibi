import type { NicheId } from "@/lib/niche/types";

/** Contexto de segmento resolvido (tenant + nicho) para landing, login e sessão. */
export type ResolvedSegment = {
  niche: NicheId;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
};

export function buildSegmentSearchParams(segment: {
  tenantSlug?: string | null;
  niche?: NicheId | null;
}): string {
  const params = new URLSearchParams();
  if (segment.tenantSlug) {
    params.set("tenant", segment.tenantSlug);
  } else if (segment.niche && segment.niche !== "MEDICAL") {
    params.set("niche", segment.niche);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function appendSegmentToPath(
  path: string,
  segment: { tenantSlug?: string | null; niche?: NicheId | null },
): string {
  const query = buildSegmentSearchParams(segment);
  if (!query) return path;
  return path.includes("?") ? `${path}&${query.slice(1)}` : `${path}${query}`;
}
