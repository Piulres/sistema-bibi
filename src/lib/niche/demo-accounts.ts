import type { NicheId } from "@/lib/niche/types";
import { getNicheConfig } from "@/lib/niche/defaults";

export type NicheDemoAccount = {
  niche: NicheId;
  tenant: string;
  internoEmail: string;
};

/** Contas demo internas por nicho — senha universal `bibi123`. */
export const NICHE_INTERNO_DEMOS: NicheDemoAccount[] = [
  { niche: "MEDICAL", tenant: "Clínica Horizonte", internoEmail: "faturamento@bibi.health" },
  { niche: "VET", tenant: "PetCare", internoEmail: "operacao@petcare.demo" },
  { niche: "DENTAL", tenant: "Smile Odonto", internoEmail: "operacao@smile.demo" },
  { niche: "LEGAL", tenant: "Lex & Partners", internoEmail: "operacao@lex.demo" },
  { niche: "SPA", tenant: "Zen Studio", internoEmail: "operacao@zen.demo" },
  { niche: "EDUCATION", tenant: "EduPrime", internoEmail: "operacao@eduprime.demo" },
];

export function nicheDemoLabel(niche: NicheId): string {
  return getNicheConfig(niche).name;
}
