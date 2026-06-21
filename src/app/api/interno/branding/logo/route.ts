import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { validateLogoUrl } from "@/lib/theme/branding-validation";

const MAX_BYTES = 200_000;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

/** Upload de logo (POC): converte para data URL e persiste em TenantBranding.logoUrl. */
export async function POST(request: Request) {
  try {
    const user = await requireUser(["INTERNO"]);
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
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    const logoError = validateLogoUrl(dataUrl);
    if (logoError) {
      return NextResponse.json({ error: logoError }, { status: 400 });
    }

    const branding = await prisma.tenantBranding.upsert({
      where: { tenantId: user.tenantId },
      create: {
        tenantId: user.tenantId,
        displayName: user.tenantName,
        logoUrl: dataUrl,
      },
      update: { logoUrl: dataUrl },
    });

    return NextResponse.json({
      logoUrl: branding.logoUrl,
      message: "Logo atualizado",
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
