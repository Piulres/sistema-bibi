import type { BrandingTokens } from "@/lib/theme/tokens";

/** Entrada mínima para renderizar a marca (UI, PWA, exports, OG). */
export type BrandMarkInput = {
  displayName: string;
  logoUrl?: string | null;
  primaryColor: string;
  accentColor: string;
  heroFrom?: string;
  heroTo?: string;
};

export type BrandMarkSize = "xs" | "sm" | "md" | "lg" | "xl" | "pwa";

export const BRAND_MARK_SIZE_PX: Record<BrandMarkSize, number> = {
  xs: 24,
  sm: 36,
  md: 40,
  lg: 64,
  xl: 96,
  pwa: 512,
};

/** Primeira letra significativa do nome comercial (fallback "B" = Bibi). */
export function brandMarkInitial(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return "B";
  const match = trimmed.match(/[\p{L}\p{N}]/u);
  return (match?.[0] ?? "B").toUpperCase();
}

/** Adapta tokens de branding para a marca. */
export function brandMarkFromBranding(branding: BrandingTokens): BrandMarkInput {
  return {
    displayName: branding.displayName,
    logoUrl: branding.logoUrl,
    primaryColor: branding.primaryColor,
    accentColor: branding.accentColor,
    heroFrom: branding.heroFrom,
    heroTo: branding.heroTo,
  };
}

export type BrandMarkLayout = {
  backgroundFrom: string;
  backgroundTo: string;
  primaryColor: string;
  accentColor: string;
  initial: string;
  logoUrl: string | null;
};

/** Geometria e cores da marca — fonte única para SVG, OG e UI. */
export function resolveBrandMarkLayout(
  input: BrandMarkInput,
  size = 512,
): BrandMarkLayout {
  void size;

  return {
    backgroundFrom: input.heroFrom ?? input.primaryColor,
    backgroundTo: input.heroTo ?? input.accentColor,
    primaryColor: input.primaryColor,
    accentColor: input.accentColor,
    initial: brandMarkInitial(input.displayName),
    logoUrl: input.logoUrl ?? null,
  };
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** CSS mesh hero equivalente — usado na UI React. */
export function brandMarkMeshBackground(layout: BrandMarkLayout): string {
  const accentGlow = `${layout.accentColor}59`;
  const primaryGlow = `${layout.primaryColor}40`;
  return [
    `radial-gradient(ellipse 80% 50% at 50% -20%, ${accentGlow}, transparent)`,
    `radial-gradient(ellipse 60% 40% at 100% 0%, ${primaryGlow}, transparent)`,
    `radial-gradient(ellipse 50% 30% at 0% 100%, ${accentGlow}26, transparent)`,
    `linear-gradient(to bottom right, ${layout.backgroundFrom}, ${layout.backgroundTo})`,
  ].join(", ");
}

/** SVG estático da marca — usado em API, e-mails e geração de PNG. */
export function buildBrandMarkSvg(input: BrandMarkInput, size = 512): string {
  const layout = resolveBrandMarkLayout(input, size);
  const cx = size / 2;
  const cy = size / 2;
  const logoImgSize = Math.round(size * 0.58);
  const initialSize = Math.round(size * 0.42);
  const uid = `bm-${size}`;
  const clipR = size / 2;

  const logoLayer = layout.logoUrl
    ? `<image
        href="${escapeXml(layout.logoUrl)}"
        x="${cx - Math.round(logoImgSize / 2)}"
        y="${cy - Math.round(logoImgSize / 2)}"
        width="${logoImgSize}"
        height="${logoImgSize}"
        preserveAspectRatio="xMidYMid meet"
      />`
    : `<text
        x="${cx}"
        y="${cy}"
        text-anchor="middle"
        dominant-baseline="central"
        fill="#ffffff"
        font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-size="${initialSize}"
        font-weight="700"
      >${escapeXml(layout.initial)}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeXml(input.displayName)}">
  <title>${escapeXml(input.displayName)}</title>
  <defs>
    <linearGradient id="bg-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${layout.backgroundFrom}" />
      <stop offset="100%" stop-color="${layout.backgroundTo}" />
    </linearGradient>
    <radialGradient id="glow-accent-${uid}" cx="50%" cy="0%" rx="70%" ry="50%">
      <stop offset="0%" stop-color="${layout.accentColor}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${layout.accentColor}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glow-primary-${uid}" cx="100%" cy="0%" rx="60%" ry="40%">
      <stop offset="0%" stop-color="${layout.primaryColor}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="${layout.primaryColor}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glow-bottom-${uid}" cx="0%" cy="100%" rx="50%" ry="30%">
      <stop offset="0%" stop-color="${layout.accentColor}" stop-opacity="0.15" />
      <stop offset="100%" stop-color="${layout.accentColor}" stop-opacity="0" />
    </radialGradient>
    <clipPath id="clip-${uid}">
      <circle cx="${cx}" cy="${cy}" r="${clipR}" />
    </clipPath>
  </defs>
  <g clip-path="url(#clip-${uid})">
    <rect width="${size}" height="${size}" fill="url(#bg-${uid})" />
    <rect width="${size}" height="${size}" fill="url(#glow-accent-${uid})" />
    <rect width="${size}" height="${size}" fill="url(#glow-primary-${uid})" />
    <rect width="${size}" height="${size}" fill="url(#glow-bottom-${uid})" />
    ${logoLayer}
  </g>
</svg>`;
}
