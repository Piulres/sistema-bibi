import type { NicheId } from "@/lib/niche/types";

/** Paleta canônica por segmento — listagens, landing de nicho e presets white label. */
export type SegmentColorPreset = {
  primaryColor: string;
  accentColor: string;
  heroFrom: string;
  heroTo: string;
  label: string;
};

export const SEGMENT_COLORS: Record<NicheId, SegmentColorPreset> = {
  MEDICAL: {
    primaryColor: "#1e293b",
    accentColor: "#2563eb",
    heroFrom: "#1e293b",
    heroTo: "#2563eb",
    label: "Saúde",
  },
  VET: {
    primaryColor: "#059669",
    accentColor: "#34d399",
    heroFrom: "#047857",
    heroTo: "#34d399",
    label: "Veterinária",
  },
  DENTAL: {
    primaryColor: "#0891b2",
    accentColor: "#22d3ee",
    heroFrom: "#0e7490",
    heroTo: "#22d3ee",
    label: "Odontologia",
  },
  LEGAL: {
    primaryColor: "#1e3a5f",
    accentColor: "#c9a227",
    heroFrom: "#0f2744",
    heroTo: "#2d4a6f",
    label: "Jurídico",
  },
  SPA: {
    primaryColor: "#7c3aed",
    accentColor: "#e879f9",
    heroFrom: "#6d28d9",
    heroTo: "#f472b6",
    label: "Bem-estar",
  },
  EDUCATION: {
    primaryColor: "#d97706",
    accentColor: "#fbbf24",
    heroFrom: "#b45309",
    heroTo: "#fcd34d",
    label: "Educação",
  },
};

export function getSegmentColors(niche: NicheId): SegmentColorPreset {
  return SEGMENT_COLORS[niche];
}

export function segmentGradient(niche: NicheId): string {
  const colors = getSegmentColors(niche);
  return `linear-gradient(90deg, ${colors.primaryColor}, ${colors.accentColor})`;
}

export function segmentGradientDiagonal(niche: NicheId): string {
  const colors = getSegmentColors(niche);
  return `linear-gradient(135deg, ${colors.heroFrom}, ${colors.heroTo})`;
}

export function segmentPillStyle(
  niche: NicheId,
  active: boolean,
): { backgroundColor?: string; color?: string; borderColor?: string } {
  const colors = getSegmentColors(niche);
  if (active) {
    return {
      backgroundColor: colors.primaryColor,
      color: "#ffffff",
      borderColor: colors.primaryColor,
    };
  }
  return {
    borderColor: `${colors.primaryColor}55`,
    color: colors.primaryColor,
  };
}
