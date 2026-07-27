import { NextResponse } from "next/server";
import { authErrorResponse, requireInternoModuleWrite } from "@/lib/api-auth";
import { isInternoAdmin } from "@/lib/interno-permissions";
import {
  isValidProvisionCedigConfirmation,
  provisionCedigForOperation,
  PROVISION_CEDIG_CONFIRM,
} from "@/lib/operation/provision-cedig";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

/**
 * Provisiona o tenant CEDIG no banco ativo (idempotente).
 * Body: { "confirm": "CEDIG" } — somente ADMIN.
 */
export async function POST(request: Request) {
  try {
    const user = await requireInternoModuleWrite("seguranca");
    if (!isInternoAdmin(user.role, user.internoProfile)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as { confirm?: string };
    if (!isValidProvisionCedigConfirmation(body.confirm)) {
      return NextResponse.json(
        { error: `Digite "${PROVISION_CEDIG_CONFIRM}" para confirmar` },
        { status: 400 },
      );
    }

    const result = await provisionCedigForOperation();

    await recordTimelineEvent({
      tenantId: user.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.SECURITY,
      entityId: result.tenantId,
      action: TIMELINE_ACTIONS.DATA_STORE_CHANGED,
      description: result.created
        ? `Tenant CEDIG provisionado no modo ${result.mode}`
        : `Tenant CEDIG atualizado no modo ${result.mode}`,
      createdBy: user.id,
    });

    return NextResponse.json({
      message: result.created
        ? "CEDIG Cruzeiro provisionado — equipe e catálogo prontos."
        : "CEDIG Cruzeiro já existia — catálogo e equipe atualizados.",
      ...result,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
