import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { isAssistantEnabled } from "@/lib/assistant/config";
import { executePendingAction } from "@/lib/assistant/confirm-executor";
import { cancelPendingAction, consumePendingAction } from "@/lib/assistant/pending-actions";
import type { AssistantConfirmRequest } from "@/lib/assistant/types";

/** Confirma ou cancela ação pendente do assistente. */
export async function POST(request: Request) {
  try {
    if (!isAssistantEnabled()) {
      return NextResponse.json({ error: "Assistente desabilitado" }, { status: 503 });
    }

    const user = await requireUser();
    const body = (await request.json()) as AssistantConfirmRequest;

    if (!body.pendingActionId?.trim()) {
      return NextResponse.json({ error: "pendingActionId obrigatório." }, { status: 400 });
    }

    if (!body.confirmed) {
      cancelPendingAction(body.pendingActionId, user.id, user.tenantId);
      return NextResponse.json({
        message: { role: "assistant", content: "Ação cancelada." },
      });
    }

    const payload = consumePendingAction(body.pendingActionId, user.id, user.tenantId);
    if (!payload) {
      return NextResponse.json({ error: "Ação expirada ou inválida." }, { status: 410 });
    }

    const result = await executePendingAction(user, payload, body.password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: { role: "assistant", content: result.message },
      href: result.href,
      entityId: result.entityId,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
