import type { NicheId } from "@/lib/niche/types";

/** Paleta canônica por segmento — usada em listagens, banners, selects e landing de nicho. */
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
    primaryColor: "#475569",
    accentColor: "#d97706",
    heroFrom: "#334155",
    heroTo: "#d97706",
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

/** Estilo inline para pill/chip de segmento (switcher, menu mobile, selects). */
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

/** Gradiente horizontal para faixas e cards de segmento. */
export function segmentGradient(niche: NicheId): string {
  const colors = getSegmentColors(niche);
  return `linear-gradient(90deg, ${colors.primaryColor}, ${colors.accentColor})`;
}

/** Gradiente diagonal para ícones e avatares de segmento. */
export function segmentGradientDiagonal(niche: NicheId): string {
  const colors = getSegmentColors(niche);
  return `linear-gradient(135deg, ${colors.heroFrom}, ${colors.heroTo})`;
}
