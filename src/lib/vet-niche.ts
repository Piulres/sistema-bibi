import "server-only";
import type { NicheId } from "@/lib/niche/types";

export function requiresPet(niche: string | NicheId | null | undefined): boolean {
  return niche === "VET";
}
