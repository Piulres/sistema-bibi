import { NextResponse } from "next/server";
import { readTenantLogo } from "@/lib/storage/tenant-logo";

type Params = { params: Promise<{ tenantId: string }> };

/** Serve logo white-label armazenado (Netlify Blobs ou filesystem local). */
export async function GET(_request: Request, { params }: Params) {
  const { tenantId } = await params;
  const logo = await readTenantLogo(tenantId);
  if (!logo) {
    return NextResponse.json({ error: "Logo não encontrado" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(logo.buffer), {
    headers: {
      "Content-Type": logo.contentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Netlify-CDN-Cache-Control": "public, durable, max-age=3600, must-revalidate",
      "Cache-Tag": `tenant-logo-${tenantId}`,
    },
  });
}
