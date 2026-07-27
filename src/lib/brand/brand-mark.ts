import type { BrandingTokens } from "@/lib/theme/tokens";

/** Entrada mínima para renderizar a marca circular (UI, PWA, exports, OG). */
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

/** Adapta tokens de branding para a marca circular. */
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
  frameColor: string;
  canvasColor: string;
  circleCenterY: number;
  circleRadius: number;
  gradientFrom: string;
  gradientTo: string;
  initial: string;
  logoUrl: string | null;
};

const FRAME_COLOR = "#0a1018";
const CANVAS_INSET_RATIO = 0.0625;
const CIRCLE_RADIUS_RATIO = 0.352;
const CIRCLE_CENTER_Y_RATIO = 0.47;

/** Geometria e cores da marca circular — fonte única para SVG, OG e UI. */
export function resolveBrandMarkLayout(
  input: BrandMarkInput,
  size = 512,
): BrandMarkLayout {
  const canvasColor = input.primaryColor;
  const circleRadius = Math.round(size * CIRCLE_RADIUS_RATIO);
  const circleCenterY = Math.round(size * CIRCLE_CENTER_Y_RATIO);

  return {
    frameColor: FRAME_COLOR,
    canvasColor,
    circleCenterY,
    circleRadius,
    gradientFrom: input.accentColor,
    gradientTo: input.heroTo ?? input.accentColor,
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

/** SVG estático da marca — usado em API, e-mails e geração de PNG. */
export function buildBrandMarkSvg(input: BrandMarkInput, size = 512): string {
  const layout = resolveBrandMarkLayout(input, size);
  const inset = Math.round(size * CANVAS_INSET_RATIO);
  const inner = size - inset * 2;
  const cx = size / 2;
  const cy = layout.circleCenterY;
  const r = layout.circleRadius;
  const gradId = `bm-${size}`;

  const logoLayer = layout.logoUrl
    ? `<clipPath id="logo-clip-${size}">
        <circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.72)}" />
      </clipPath>
      <circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.78)}" fill="rgba(255,255,255,0.92)" />
      <image
        href="${escapeXml(layout.logoUrl)}"
        x="${cx - Math.round(r * 0.62)}"
        y="${cy - Math.round(r * 0.62)}"
        width="${Math.round(r * 1.24)}"
        height="${Math.round(r * 1.24)}"
        clip-path="url(#logo-clip-${size})"
        preserveAspectRatio="xMidYMid meet"
      />`
    : `<text
        x="${cx}"
        y="${cy}"
        text-anchor="middle"
        dominant-baseline="central"
        fill="#ffffff"
        font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-size="${Math.round(r * 0.92)}"
        font-weight="700"
      >${escapeXml(layout.initial)}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeXml(input.displayName)}">
  <title>${escapeXml(input.displayName)}</title>
  <rect width="${size}" height="${size}" fill="${layout.frameColor}" />
  <rect x="${inset}" y="${inset}" width="${inner}" height="${inner}" fill="${layout.canvasColor}" />
  <defs>
    <linearGradient id="${gradId}" x1="18%" y1="12%" x2="88%" y2="92%">
      <stop offset="0%" stop-color="${layout.gradientFrom}" />
      <stop offset="100%" stop-color="${layout.gradientTo}" />
    </linearGradient>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${gradId})" />
  ${logoLayer}
</svg>`;
}
