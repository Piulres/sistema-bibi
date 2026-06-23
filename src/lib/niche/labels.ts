import { getDefaultLabels } from "@/lib/niche/defaults";
import type { NicheLabels } from "@/lib/niche/types";

/** Mescla labels do tenant (JSON) com defaults do nicho. */
export function mergeNicheLabels(
  niche: string,
  rawLabels: string | null | undefined,
): NicheLabels {
  const defaults = getDefaultLabels(niche);
  if (!rawLabels) return defaults;
  try {
    const parsed = JSON.parse(rawLabels) as Partial<NicheLabels>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}
