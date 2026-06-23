/** Nichos suportados pelo ServiceOS (v2.0). */
export const NICHE_IDS = [
  "MEDICAL",
  "VET",
  "DENTAL",
  "LEGAL",
  "SPA",
  "EDUCATION",
] as const;

export type NicheId = (typeof NICHE_IDS)[number];

export function isNicheId(value: string): value is NicheId {
  return (NICHE_IDS as readonly string[]).includes(value);
}

/** Chaves de termos traduzíveis na UI. */
export type NicheLabelKey =
  | "patient"
  | "patients"
  | "provider"
  | "providers"
  | "procedure"
  | "procedures"
  | "appointment"
  | "appointments"
  | "medicalRecord"
  | "beneficiary"
  | "beneficiaries"
  | "company"
  | "portalBeneficiary"
  | "portalProvider"
  | "service";

export type NicheLabels = Record<NicheLabelKey, string>;

export type NicheConfig = {
  id: NicheId;
  name: string;
  tagline: string;
  labels: NicheLabels;
  branding: {
    primaryColor: string;
    accentColor: string;
    heroFrom: string;
    heroTo: string;
  };
  landing: {
    badge: string;
    headline: string;
    headlineAccent: string;
    description: string;
    keywords: string[];
  };
};
