import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { isAssistantEnabled } from "@/lib/assistant/config";
import { runAssistantChat } from "@/lib/assistant/runner";
import type { AssistantChatRequest, AssistantMessage } from "@/lib/assistant/types";
import { ROLES } from "@/lib/roles";

const ALLOWED_ROLES = new Set<string>([
  ROLES.INTERNO,
  ROLES.PRESTADOR,
  ROLES.PJ,
  ROLES.BENEFICIARIO,
]);

function parseMessages(raw: unknown): AssistantMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is AssistantMessage =>
        typeof item === "object" &&
        item !== null &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string",
    )
    .map((item) => ({ role: item.role, content: item.content.trim() }))
    .filter((item) => item.content.length > 0)
    .slice(-20);
}

/** Chat do assistente operacional — todos os portais autenticados. */
export async function POST(request: Request) {
  try {
    if (!isAssistantEnabled()) {
      return NextResponse.json({ error: "Assistente desabilitado" }, { status: 503 });
    }

    const user = await requireUser();
    if (!ALLOWED_ROLES.has(user.role)) {
      return NextResponse.json({ error: "Portal não suportado pelo assistente." }, { status: 403 });
    }

    let body: AssistantChatRequest;
    try {
      body = (await request.json()) as AssistantChatRequest;
    } catch {
      return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
    }
    const messages = parseMessages(body.messages);
    if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
      return NextResponse.json({ error: "Envie ao menos uma mensagem do usuário." }, { status: 400 });
    }

    const result = await runAssistantChat({
      user,
      messages,
      pageContext: typeof body.pageContext === "string" ? body.pageContext : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
