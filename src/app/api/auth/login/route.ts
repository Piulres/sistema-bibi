import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/password";
import { getPrisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import { PORTALS, type PortalKey } from "@/lib/roles";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";
import { createMfaChallengeToken } from "@/lib/mfa";
import { isNicheId } from "@/lib/niche/types";
import { getNicheConfig } from "@/lib/niche/defaults";
import { ensureDataStoreForSegmentAccess } from "@/lib/data-store/ensure-data-store-for-segment";
import {
  buildLoginSegmentResponse,
  validateUserSegmentAccess,
} from "@/lib/segment/auth";
import { persistSegmentCookie } from "@/lib/segment/cookie";

export async function POST(request: Request) {
  let body: { email?: string; password?: string; portal?: string; tenantSlug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { email, password, portal, tenantSlug } = body;
  if (!email || !password || !portal) {
    return NextResponse.json(
      { error: "Informe e-mail, senha e portal" },
      { status: 400 },
    );
  }

  await ensureDataStoreForSegmentAccess({ tenantSlug, email });

  const prisma = await getPrisma();

  const portalConfig = PORTALS[portal as PortalKey];
  if (!portalConfig) {
    return NextResponse.json({ error: "Portal inválido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { tenant: { select: { slug: true, name: true, niche: true } } },
  });

  if (!user || !verifyPassword(password, user.password)) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos" },
      { status: 401 },
    );
  }

  if (user.role !== portalConfig.role) {
    return NextResponse.json(
      { error: `Esta conta não tem acesso ao ${portalConfig.label}` },
      { status: 403 },
    );
  }

  if (portalConfig.role === "BENEFICIARIO" && !user.patientId) {
    return NextResponse.json(
      { error: "Conta sem beneficiário vinculado" },
      { status: 403 },
    );
  }

  const segmentCheck = await validateUserSegmentAccess(request, user, { tenantSlug });
  if (!segmentCheck.ok) {
    return NextResponse.json({ error: segmentCheck.message }, { status: segmentCheck.status });
  }

  if (user.mfaEnabled && user.mfaSecret) {
    return NextResponse.json({
      mfaRequired: true,
      mfaToken: createMfaChallengeToken(user.id, portal),
    });
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
    description: `Login no ${portalConfig.label} · segmento ${getNicheConfig(niche).name} (${user.tenant.slug})`,
    createdBy: user.id,
  });

  const segment = await buildLoginSegmentResponse(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
      tenantName: user.tenant.name,
      niche,
    },
    segment,
    redirectTo: portalConfig.dashboardPath,
  });
}
