import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getPrisma } from "@/lib/db";
import { CLINIC_BRANDING_DEFAULTS, type BrandingTokens } from "@/lib/theme/tokens";
import { normalizeColorScheme } from "@/lib/theme/color-scheme";
import { applyNicheBrandingDefaults } from "@/lib/niche/branding";
import { mergeNicheLabels } from "@/lib/niche/labels";
import { isNicheId, type NicheId, type NicheLabels } from "@/lib/niche/types";
import {
  resolveInternoPermissions,
  type InternoModule,
} from "@/lib/interno-permissions";

const COOKIE_NAME = "bibi_session";
const SECRET = process.env.SESSION_SECRET ?? "bibi-poc-dev-secret-change-me";

function sign(value: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${sig}`;
}

function verify(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  // Comparacao em tempo constante para evitar timing attacks.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

export async function createSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  tenantSlug: string;
  companyId: string | null;
  patientId: string | null;
  tenantName: string;
  companyName: string | null;
  patientName: string | null;
  internoProfile: string | null;
  internoPermissions: InternoModule[];
  branding: BrandingTokens;
  niche: NicheId;
  labels: NicheLabels;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const userId = verify(token);
  if (!userId) return null;

  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: { include: { branding: true } }, company: true, patient: true },
  });
  if (!user) return null;

  const brandingRow = user.tenant.branding;
  const niche: NicheId =
    user.tenant.niche && isNicheId(user.tenant.niche) ? user.tenant.niche : "MEDICAL";
  const labels = mergeNicheLabels(niche, user.tenant.labels);

  const baseBranding: BrandingTokens = brandingRow
    ? {
        displayName: brandingRow.displayName,
        tagline: brandingRow.tagline,
        logoUrl: brandingRow.logoUrl,
        primaryColor: brandingRow.primaryColor,
        accentColor: brandingRow.accentColor,
        heroFrom: brandingRow.heroFrom,
        heroTo: brandingRow.heroTo,
        platformLabel: brandingRow.platformLabel,
        colorScheme: normalizeColorScheme(brandingRow.colorScheme),
        customDomain: brandingRow.customDomain,
        customDomainVerified: brandingRow.customDomainVerified,
      }
    : { displayName: user.tenant.name, ...CLINIC_BRANDING_DEFAULTS };

  const branding = brandingRow
    ? applyNicheBrandingDefaults(niche, baseBranding, { fromDatabase: true })
    : applyNicheBrandingDefaults(niche, baseBranding);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    tenantSlug: user.tenant.slug,
    companyId: user.companyId,
    patientId: user.patientId,
    tenantName: user.tenant.name,
    companyName: user.company?.name ?? null,
    patientName: user.patient?.name ?? null,
    internoProfile: user.internoProfile,
    internoPermissions: resolveInternoPermissions(user.role, user.internoProfile),
    branding,
    niche,
    labels,
  };
}
