import type { BrandingTokens } from "@/lib/theme/tokens";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export type BrandingInput = {
  displayName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  accentColor: string;
  heroFrom: string;
  heroTo: string;
  platformLabel: string;
};

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (HEX_COLOR.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

export function validateLogoUrl(value: string | null | undefined): string | null {
  if (value == null || value.trim() === "") return null;
  const url = value.trim();
  if (url.startsWith("data:image/")) {
    if (url.length > 300_000) return "Logo em base64 excede o limite de 300KB";
    return null;
  }
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "URL do logo deve usar http ou https";
    }
  } catch {
    return "URL do logo inválida";
  }
  return null;
}

export function validateBrandingInput(input: BrandingInput): string | null {
  if (!input.displayName?.trim()) return "Nome de exibição é obrigatório";
  if (input.displayName.trim().length > 120) return "Nome de exibição muito longo";

  for (const [label, color] of [
    ["Cor primária", input.primaryColor],
    ["Cor de destaque", input.accentColor],
    ["Hero (início)", input.heroFrom],
    ["Hero (fim)", input.heroTo],
  ] as const) {
    if (!normalizeHexColor(color)) return `${label} deve ser hex (#RRGGBB)`;
  }

  if (!input.platformLabel?.trim()) return "Rótulo da plataforma é obrigatório";

  const logoError = validateLogoUrl(input.logoUrl);
  if (logoError) return logoError;

  if (input.tagline && input.tagline.length > 240) {
    return "Tagline muito longa (máx. 240 caracteres)";
  }

  return null;
}

export function sanitizeBrandingInput(input: BrandingInput): BrandingTokens {
  return {
    displayName: input.displayName.trim(),
    tagline: input.tagline?.trim() || null,
    logoUrl: input.logoUrl?.trim() || null,
    primaryColor: normalizeHexColor(input.primaryColor)!,
    accentColor: normalizeHexColor(input.accentColor)!,
    heroFrom: normalizeHexColor(input.heroFrom)!,
    heroTo: normalizeHexColor(input.heroTo)!,
    platformLabel: input.platformLabel.trim(),
  };
}
