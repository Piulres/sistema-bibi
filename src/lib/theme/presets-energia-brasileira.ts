import type { NicheId } from "@/lib/niche/types";

/** Presets de cor primária por nicho — Orange (#f97316) como accent global. */
export const NICHE_PRESETS_ENERGIA_BRASILEIRA: Record<
  NicheId,
  {
    primaryColor: string;
    accentColor: string;
    heroFrom: string;
    heroTo: string;
    label: string;
  }
> = {
  MEDICAL: {
    primaryColor: "#1e293b",
    accentColor: "#f97316",
    heroFrom: "#1e293b",
    heroTo: "#f59e0b",
    label: "Saúde",
  },
  VET: {
    primaryColor: "#059669",
    accentColor: "#f97316",
    heroFrom: "#059669",
    heroTo: "#f59e0b",
    label: "Veterinária",
  },
  DENTAL: {
    primaryColor: "#0891b2",
    accentColor: "#f97316",
    heroFrom: "#0891b2",
    heroTo: "#f59e0b",
    label: "Odontologia",
  },
  LEGAL: {
    primaryColor: "#475569",
    accentColor: "#f97316",
    heroFrom: "#475569",
    heroTo: "#f59e0b",
    label: "Jurídico",
  },
  SPA: {
    primaryColor: "#a78bfa",
    accentColor: "#f97316",
    heroFrom: "#a78bfa",
    heroTo: "#f59e0b",
    label: "Bem-estar",
  },
  EDUCATION: {
    primaryColor: "#d97706",
    accentColor: "#f97316",
    heroFrom: "#d97706",
    heroTo: "#f59e0b",
    label: "Educação",
  },
};
