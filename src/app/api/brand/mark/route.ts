import { brandMarkFromBranding, buildBrandMarkSvg } from "@/lib/brand/brand-mark";
import { getPlatformBranding } from "@/lib/theme/branding";

/** Marca circular da plataforma em SVG — reutilizável em embeds e integrações. */
export async function GET() {
  const branding = getPlatformBranding();
  const svg = buildBrandMarkSvg(brandMarkFromBranding(branding), 512);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
