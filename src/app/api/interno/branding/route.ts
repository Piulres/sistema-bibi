import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { getTenantBranding } from "@/lib/theme/branding";
import {
  sanitizeBrandingInput,
  validateBrandingInput,
  normalizeCustomDomain,
  type BrandingInput,
} from "@/lib/theme/branding-validation";

function brandingResponse(row: {
  displayName: string;
  tagline: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  heroFrom: string;
  heroTo: string;
  platformLabel: string;
  colorScheme: string;
  customDomain: string | null;
  customDomainVerified: boolean;
}) {
  return {
    displayName: row.displayName,
    tagline: row.tagline,
    logoUrl: row.logoUrl,
    primaryColor: row.primaryColor,
    accentColor: row.accentColor,
    heroFrom: row.heroFrom,
    heroTo: row.heroTo,
    platformLabel: row.platformLabel,
    colorScheme: row.colorScheme,
    customDomain: row.customDomain,
    customDomainVerified: row.customDomainVerified,
  };
}

export async function GET() {
  try {
    const user = await requireInternoModule("branding");
    const branding = await getTenantBranding(user.tenantId);
    return NextResponse.json({ branding });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  const prisma = await getPrisma();
  try {
    const user = await requireInternoModule("branding");
    const body = (await request.json()) as BrandingInput;

    const validationError = validateBrandingInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const data = sanitizeBrandingInput(body);
    const existing = await prisma.tenantBranding.findUnique({
      where: { tenantId: user.tenantId },
    });

    const nextDomain = data.customDomain;
    const domainChanged =
      normalizeCustomDomain(existing?.customDomain) !== normalizeCustomDomain(nextDomain);

    let customDomainVerified = existing?.customDomainVerified ?? false;
    if (domainChanged) {
      customDomainVerified = false;
    } else if (body.verifyCustomDomain && nextDomain) {
      customDomainVerified = true;
    }

    const branding = await prisma.tenantBranding.upsert({
      where: { tenantId: user.tenantId },
      create: {
        tenantId: user.tenantId,
        ...data,
        customDomainVerified,
      },
      update: {
        ...data,
        customDomainVerified,
      },
    });

    return NextResponse.json({
      branding: brandingResponse(branding),
      message: body.verifyCustomDomain
        ? "Domínio marcado como verificado (POC)"
        : "Identidade visual atualizada",
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
