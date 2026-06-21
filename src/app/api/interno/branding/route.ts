import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getTenantBranding } from "@/lib/theme/branding";
import {
  sanitizeBrandingInput,
  validateBrandingInput,
  type BrandingInput,
} from "@/lib/theme/branding-validation";

export async function GET() {
  try {
    const user = await requireUser(["INTERNO"]);
    const branding = await getTenantBranding(user.tenantId);
    return NextResponse.json({ branding });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser(["INTERNO"]);
    const body = (await request.json()) as BrandingInput;

    const validationError = validateBrandingInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const data = sanitizeBrandingInput(body);

    const branding = await prisma.tenantBranding.upsert({
      where: { tenantId: user.tenantId },
      create: { tenantId: user.tenantId, ...data },
      update: data,
    });

    return NextResponse.json({
      branding: {
        displayName: branding.displayName,
        tagline: branding.tagline,
        logoUrl: branding.logoUrl,
        primaryColor: branding.primaryColor,
        accentColor: branding.accentColor,
        heroFrom: branding.heroFrom,
        heroTo: branding.heroTo,
        platformLabel: branding.platformLabel,
      },
      message: "Identidade visual atualizada",
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
