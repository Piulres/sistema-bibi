import { resolveNicheLabels } from "@/constants/niches";
import type { NicheLabels } from "@/lib/niche/types";

/** Mescla `Tenant.labels` (JSON) com o dicionário mestre do nicho. */
export function mergeNicheLabels(
  niche: string,
  rawLabels: string | null | undefined,
): NicheLabels {
  if (!rawLabels) return resolveNicheLabels(niche);
  try {
    const parsed = JSON.parse(rawLabels) as Partial<NicheLabels>;
    return resolveNicheLabels(niche, parsed);
  } catch {
    return resolveNicheLabels(niche);
  }
}
