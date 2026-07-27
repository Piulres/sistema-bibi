import { buildBrandMarkSvg } from "@/lib/brand/brand-mark";
import { getTenantBranding } from "@/lib/theme/branding";

type Params = { params: Promise<{ tenantId: string }> };

/** Marca circular whitelabel do tenant em SVG. */
export async function GET(_request: Request, { params }: Params) {
  const { tenantId } = await params;
  const branding = await getTenantBranding(tenantId);
  const svg = buildBrandMarkSvg(
    {
      displayName: branding.displayName,
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor,
      accentColor: branding.accentColor,
      heroFrom: branding.heroFrom,
      heroTo: branding.heroTo,
    },
    512,
  );

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Cache-Tag": `tenant-brand-mark-${tenantId}`,
    },
  });
}
