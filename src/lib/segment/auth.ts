import "server-only";
import { getPrisma } from "@/lib/db";
import { isNicheId, type NicheId } from "@/lib/niche/types";
import { getNicheConfig } from "@/lib/niche/defaults";
import { resolveSegmentFromLoginRequest } from "@/lib/segment/resolve";
import { toLoginSegmentPayload } from "@/lib/segment/login-context";

export type SegmentAuthError = {
  ok: false;
  status: 403;
  message: string;
};

export type SegmentAuthOk = {
  ok: true;
  expectedTenantId: string | null;
};

/** Valida se o colaborador pertence ao tenant do segmento ativo no site. */
export async function validateUserSegmentAccess(
  request: Request,
  user: { tenantId: string },
  body?: { tenantSlug?: string | null },
): Promise<SegmentAuthOk | SegmentAuthError> {
  const segment = await resolveSegmentFromLoginRequest(request, body);
  if (segment.tenantId && user.tenantId !== segment.tenantId) {
    const prisma = await getPrisma();
    const userTenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { name: true, slug: true, niche: true },
    });
    const expectedName = segment.tenantName ?? segment.tenantSlug ?? "esta operação";
    const userNiche = userTenant?.niche && isNicheId(userTenant.niche)
      ? getNicheConfig(userTenant.niche).name
      : "outro segmento";
    return {
      ok: false,
      status: 403,
      message: `Esta conta pertence a ${userTenant?.name ?? userNiche}. Acesse pelo portal de ${expectedName} (?tenant=${segment.tenantSlug ?? "…"}).`,
    };
  }
  return { ok: true, expectedTenantId: segment.tenantId };
}

export async function buildLoginSegmentResponse(userId: string) {
  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: { select: { slug: true, name: true, niche: true } } },
  });
  if (!user?.tenant) return null;
  return toLoginSegmentPayload(user, {
    slug: user.tenant.slug,
    name: user.tenant.name,
    niche: user.tenant.niche,
  });
}

export type { NicheId };
