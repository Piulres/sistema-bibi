import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { saveTenantLogo } from "@/lib/storage/tenant-logo";

const MAX_BYTES = 200_000;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

/** Upload de logo — Netlify Blobs em produção; filesystem local em dev. */
export async function POST(request: Request) {
  const prisma = await getPrisma();
  try {
    const user = await requireInternoModule("branding");
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Use PNG, JPG, WebP ou SVG." },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Arquivo excede 200KB. Use uma imagem menor ou informe uma URL." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const logoUrl = await saveTenantLogo(user.tenantId, buffer, file.type);

    const branding = await prisma.tenantBranding.upsert({
      where: { tenantId: user.tenantId },
      create: {
        tenantId: user.tenantId,
        displayName: user.tenantName,
        logoUrl,
      },
      update: { logoUrl },
    });

    return NextResponse.json({
      logoUrl: branding.logoUrl,
      storage: logoUrl.startsWith("/api/") ? "blob-or-local" : "inline",
      message: "Logo atualizado",
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
