import type { BrandingTokens } from "@/lib/theme/tokens";

export type BrandingPreset = {
  id: string;
  label: string;
  description: string;
  tokens: BrandingTokens;
};

export const BRANDING_PRESETS: BrandingPreset[] = [
  {
    id: "horizonte",
    label: "Clínica Horizonte",
    description: "Energia Brasileira — Dark Slate + Orange (demo padrão)",
    tokens: {
      displayName: "Clínica Horizonte",
      tagline: "Cuidado humanizado com gestão inteligente",
      logoUrl: null,
      primaryColor: "#1e293b",
      accentColor: "#f97316",
      heroFrom: "#1e293b",
      heroTo: "#f59e0b",
      platformLabel: "Powered by Sistema Bibi - ServiceOS",
      colorScheme: "light",
      customDomain: null,
      customDomainVerified: false,
    },
  },
  {
    id: "vitacare",
    label: "VitaCare",
    description: "Azul escuro — demo white label corporativo",
    tokens: {
      displayName: "VitaCare",
      tagline: "Saúde corporativa sob medida",
      logoUrl: null,
      primaryColor: "#2563eb",
      accentColor: "#3b82f6",
      heroFrom: "#1e3a8a",
      heroTo: "#1d4ed8",
      platformLabel: "Powered by Sistema Bibi - ServiceOS",
      colorScheme: "dark",
      customDomain: null,
      customDomainVerified: false,
    },
  },
  {
    id: "amethyst",
    label: "Amethyst Care",
    description: "Roxo — clínicas premium",
    tokens: {
      displayName: "Amethyst Care",
      tagline: "Excelência clínica com tecnologia",
      logoUrl: null,
      primaryColor: "#7c3aed",
      accentColor: "#a78bfa",
      heroFrom: "#2e1065",
      heroTo: "#5b21b6",
      platformLabel: "Powered by Sistema Bibi - ServiceOS",
      colorScheme: "light",
      customDomain: null,
      customDomainVerified: false,
    },
  },
  {
    id: "forest",
    label: "Forest Health",
    description: "Verde — bem-estar e prevenção",
    tokens: {
      displayName: "Forest Health",
      tagline: "Prevenção e cuidado integrado",
      logoUrl: null,
      primaryColor: "#059669",
      accentColor: "#34d399",
      heroFrom: "#064e3b",
      heroTo: "#047857",
      platformLabel: "Powered by Sistema Bibi - ServiceOS",
      colorScheme: "system",
      customDomain: null,
      customDomainVerified: false,
    },
  },
];
