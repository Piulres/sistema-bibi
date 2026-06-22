import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import { PORTALS, type PortalKey } from "@/lib/roles";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";
import { parseMfaChallengeToken, verifyTotp } from "@/lib/mfa";

export async function POST(request: Request) {
  const prisma = await getPrisma();
  try {
    const body = (await request.json()) as {
      mfaToken?: string;
      code?: string;
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

    const user = await prisma.user.findUnique({ where: { id: challenge.userId } });
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json({ error: "MFA não configurado" }, { status: 400 });
    }

    if (!verifyTotp(user.mfaSecret, body.code)) {
      return NextResponse.json({ error: "Código inválido" }, { status: 401 });
    }

    await createSession(user.id);

    await recordTimelineEvent({
      tenantId: user.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.USER,
      entityId: user.id,
      action: TIMELINE_ACTIONS.LOGIN,
      description: `Login MFA no ${portalConfig.label}`,
      createdBy: user.id,
    });

    return NextResponse.json({
      redirectTo: portalConfig.dashboardPath,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
