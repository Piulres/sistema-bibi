import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import { PORTALS, type PortalKey } from "@/lib/roles";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";

export async function POST(request: Request) {
  let body: { email?: string; password?: string; portal?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { email, password, portal } = body;
  if (!email || !password || !portal) {
    return NextResponse.json(
      { error: "Informe e-mail, senha e portal" },
      { status: 400 },
    );
  }

  const portalConfig = PORTALS[portal as PortalKey];
  if (!portalConfig) {
    return NextResponse.json({ error: "Portal inválido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || user.password !== password) {
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

  await createSession(user.id);

  await recordTimelineEvent({
    tenantId: user.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.USER,
    entityId: user.id,
    action: TIMELINE_ACTIONS.LOGIN,
    description: `Login no ${portalConfig.label}`,
    createdBy: user.id,
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, role: user.role },
    redirectTo: portalConfig.dashboardPath,
  });
}
