import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { isAssistantEnabled } from "@/lib/assistant/config";
import { executePendingAction } from "@/lib/assistant/confirm-executor";
import { cancelPendingAction } from "@/lib/assistant/pending-actions";
import { tryMarkPendingJtiConsumed } from "@/lib/assistant/pending-consumed";
import { decodePendingEnvelope } from "@/lib/assistant/session-state";
import type { AssistantConfirmRequest } from "@/lib/assistant/types";

/** Confirma ou cancela ação pendente do assistente. */
export async function POST(request: Request) {
  try {
    if (!isAssistantEnabled()) {
      return NextResponse.json({ error: "Assistente desabilitado" }, { status: 503 });
    }

    const user = await requireUser();

    let body: AssistantConfirmRequest;
    try {
      body = (await request.json()) as AssistantConfirmRequest;
    } catch {
      return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
    }

    if (!body.pendingActionId?.trim()) {
      return NextResponse.json({ error: "pendingActionId obrigatório." }, { status: 400 });
    }

    if (!body.confirmed) {
      cancelPendingAction(body.pendingActionId, user.id, user.tenantId);
      return NextResponse.json({
        message: { role: "assistant", content: "Ação cancelada." },
      });
    }

    const envelope = decodePendingEnvelope(body.pendingActionId, user.id, user.tenantId);
    if (!envelope) {
      return NextResponse.json({ error: "Ação expirada ou inválida." }, { status: 410 });
    }

    const firstUse = await tryMarkPendingJtiConsumed(envelope.jti);
    if (!firstUse) {
      return NextResponse.json({ error: "Esta confirmação já foi utilizada." }, { status: 410 });
    }

    const result = await executePendingAction(user, envelope.payload, body.password);
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
