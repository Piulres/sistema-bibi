import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  DemoResetError,
  executeDemoReset,
  getDemoResetStatus,
  isValidDemoResetConfirmation,
} from "@/lib/demo-reset";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

/** Status do modo demo (restauração habilitada / permissão do usuário). */
export async function GET() {
  try {
    const user = await requireInternoModule("seguranca");
    return NextResponse.json(await getDemoResetStatus(user));
  } catch (error) {
    return authErrorResponse(error);
  }
}

/**
 * Restaura o banco ao estado original do seed (modo demo).
 * Requer perfil ADMIN e confirmação explícita no body: { "confirm": "RESTAURAR" }
 */
export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("seguranca");
    const status = await getDemoResetStatus(user);

    if (!status.enabled) {
      return NextResponse.json(
        { error: "Restauração demo desabilitada neste ambiente" },
        { status: 403 },
      );
    }
    if (!status.canReset) {
      return NextResponse.json(
        { error: "Apenas administradores podem restaurar o modo demo" },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as { confirm?: string };
    if (!isValidDemoResetConfirmation(body.confirm)) {
      return NextResponse.json(
        { error: 'Digite "RESTAURAR" para confirmar a operação' },
        { status: 400 },
      );
    }

    const prisma = await getPrisma();
    const result = await executeDemoReset(prisma);

    await recordTimelineEvent({
      tenantId: user.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.SECURITY,
      entityId: user.tenantId,
      action: TIMELINE_ACTIONS.DEMO_RESET,
      description: "Estado demo restaurado ao seed original",
      createdBy: user.id,
    });

    return NextResponse.json({
      message: "Modo demo restaurado com sucesso. Faça login novamente.",
      result,
      logoutRequired: true,
    });
  } catch (error) {
    if (error instanceof DemoResetError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[demo-reset]", error);
    return NextResponse.json(
      { error: "Falha ao restaurar modo demo. Verifique os logs do servidor.",
      },
      { status: 500 },
    );
  }
}
