import type { BrandingTokens } from "@/lib/theme/tokens";
import { SEGMENT_COLORS } from "@/lib/theme/segment-colors";
import type { NicheId } from "@/lib/niche/types";
import { NICHE_IDS } from "@/lib/niche/types";

export type BrandingPreset = {
  id: string;
  label: string;
  description: string;
  group: "segment" | "variety";
  tokens: BrandingTokens;
};

const SHARED_PRESET_META: Pick<BrandingTokens, "logoUrl" | "platformLabel" | "customDomain" | "customDomainVerified"> = {
  logoUrl: null,
  platformLabel: "Powered by Sistema Bibi - ServiceOS",
  customDomain: null,
  customDomainVerified: false,
};

/** Presets nativos por segmento ServiceOS. */
export const SEGMENT_BRANDING_PRESETS: BrandingPreset[] = NICHE_IDS.map((niche) => {
  const colors = SEGMENT_COLORS[niche];
  const displayNames: Record<NicheId, string> = {
    MEDICAL: "Clínica Horizonte",
    VET: "PetCare",
    DENTAL: "Smile Odonto",
    LEGAL: "Lex & Partners",
    SPA: "Zen Studio",
    EDUCATION: "EduPrime",
    CONSTRUCTION: "Build Engenharia",
  };
  const taglines: Record<NicheId, string> = {
    MEDICAL: "Cuidado humanizado com gestão inteligente",
    VET: "Gestão completa para clínicas e pet shops",
    DENTAL: "Operação odontológica com Pay Per Use nativo",
    LEGAL: "Infraestrutura Pay Per Use para escritórios",
    SPA: "Spas e estúdios com faturamento previsível",
    EDUCATION: "Aulas e cursos com cobrança por sessão efetiva",
    CONSTRUCTION: "Gestão de obras com orçamento e cronograma",
  };

  return {
    id: `segment-${niche.toLowerCase()}`,
    label: colors.label,
    description: `Paleta nativa — segmento ${colors.label}`,
    group: "segment" as const,
    tokens: {
      displayName: displayNames[niche],
      tagline: taglines[niche],
      primaryColor: colors.primaryColor,
      accentColor: colors.accentColor,
      heroFrom: colors.heroFrom,
      heroTo: colors.heroTo,
      colorScheme: "light",
      ...SHARED_PRESET_META,
    },
  };
});

/** Variedades adicionais para white label customizado. */
export const VARIETY_BRANDING_PRESETS: BrandingPreset[] = [
  {
    id: "energia-brasileira",
    label: "Energia Brasileira",
    description: "Slate + Orange — identidade Sistema Bibi",
    group: "variety",
    tokens: {
      displayName: "Sistema Bibi",
      tagline: "Pay Per Use multi-segmento",
      primaryColor: "#1e293b",
      accentColor: "#f97316",
      heroFrom: "#1e293b",
      heroTo: "#f59e0b",
      colorScheme: "light",
      ...SHARED_PRESET_META,
    },
  },
  {
    id: "vitacare",
    label: "VitaCare",
    description: "Azul corporativo — white label B2B",
    group: "variety",
    tokens: {
      displayName: "VitaCare",
      tagline: "Saúde corporativa sob medida",
      primaryColor: "#2563eb",
      accentColor: "#3b82f6",
      heroFrom: "#1e3a8a",
      heroTo: "#1d4ed8",
      colorScheme: "dark",
      ...SHARED_PRESET_META,
    },
  },
  {
    id: "amethyst",
    label: "Amethyst Care",
    description: "Roxo premium",
    group: "variety",
    tokens: {
      displayName: "Amethyst Care",
      tagline: "Excelência com tecnologia",
      primaryColor: "#7c3aed",
      accentColor: "#a78bfa",
      heroFrom: "#2e1065",
      heroTo: "#5b21b6",
      colorScheme: "light",
      ...SHARED_PRESET_META,
    },
  },
  {
    id: "forest",
    label: "Forest Health",
    description: "Verde — bem-estar e prevenção",
    group: "variety",
    tokens: {
      displayName: "Forest Health",
      tagline: "Prevenção e cuidado integrado",
      primaryColor: "#059669",
      accentColor: "#34d399",
      heroFrom: "#064e3b",
      heroTo: "#047857",
      colorScheme: "system",
      ...SHARED_PRESET_META,
    },
  },
  {
    id: "coral",
    label: "Coral Studio",
    description: "Coral + terracota — estética e wellness",
    group: "variety",
    tokens: {
      displayName: "Coral Studio",
      tagline: "Experiências que encantam",
      primaryColor: "#e11d48",
      accentColor: "#fb7185",
      heroFrom: "#9f1239",
      heroTo: "#f43f5e",
      colorScheme: "light",
      ...SHARED_PRESET_META,
    },
  },
  {
    id: "midnight",
    label: "Midnight Pro",
    description: "Grafite + ciano — tech e serviços",
    group: "variety",
    tokens: {
      displayName: "Midnight Pro",
      tagline: "Operação profissional 24/7",
      primaryColor: "#0f172a",
      accentColor: "#06b6d4",
      heroFrom: "#020617",
      heroTo: "#0891b2",
      colorScheme: "dark",
      ...SHARED_PRESET_META,
    },
  },
];

/** Todos os presets white label (segmentos + variedades). */
export const BRANDING_PRESETS: BrandingPreset[] = [
  ...SEGMENT_BRANDING_PRESETS,
  ...VARIETY_BRANDING_PRESETS,
];
