import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import { PORTALS, type PortalKey } from "@/lib/roles";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";
import { parseMfaChallengeToken, verifyTotp } from "@/lib/mfa";
import { isNicheId } from "@/lib/niche/types";
import { getNicheConfig } from "@/lib/niche/defaults";
import {
  buildLoginSegmentResponse,
  validateUserSegmentAccess,
} from "@/lib/segment/auth";
import { persistSegmentCookie } from "@/lib/segment/cookie";
import {
  checkRateLimit,
  clientIpFromRequest,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const rate = checkRateLimit(`mfa:${clientIpFromRequest(request)}`, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterSeconds);
  }

  const prisma = await getPrisma();
  try {
    const body = (await request.json()) as {
      mfaToken?: string;
      code?: string;
      tenantSlug?: string;
    };

    if (!body.mfaToken || !body.code) {
      return NextResponse.json({ error: "Informe token MFA e código" }, { status: 400 });
    }

    const challenge = parseMfaChallengeToken(body.mfaToken);
    if (!challenge) {
      return NextResponse.json({ error: "Desafio MFA expirado ou inválido" }, { status: 401 });
    }

    const portalConfig = PORTALS[challenge.portal as PortalKey];
    if (!portalConfig) {
      return NextResponse.json({ error: "Portal inválido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: challenge.userId },
      include: { tenant: { select: { slug: true, name: true, niche: true } } },
    });
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json({ error: "MFA não configurado" }, { status: 400 });
    }

    if (!verifyTotp(user.mfaSecret, body.code)) {
      return NextResponse.json({ error: "Código inválido" }, { status: 401 });
    }

    const segmentCheck = await validateUserSegmentAccess(request, user, {
      tenantSlug: body.tenantSlug,
    });
    if (!segmentCheck.ok) {
      return NextResponse.json({ error: segmentCheck.message }, { status: segmentCheck.status });
    }

    await createSession(user.id);

    const niche =
      user.tenant.niche && isNicheId(user.tenant.niche) ? user.tenant.niche : "MEDICAL";
    await persistSegmentCookie({
      niche,
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
      tenantName: user.tenant.name,
    });

    await recordTimelineEvent({
      tenantId: user.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.USER,
      entityId: user.id,
      action: TIMELINE_ACTIONS.LOGIN,
      description: `Login MFA no ${portalConfig.label} · segmento ${getNicheConfig(niche).name} (${user.tenant.slug})`,
      createdBy: user.id,
    });

    const segment = await buildLoginSegmentResponse(user.id);

    return NextResponse.json({
      segment,
      redirectTo: portalConfig.dashboardPath,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
