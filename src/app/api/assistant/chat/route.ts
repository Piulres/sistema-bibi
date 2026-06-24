import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { isAssistantEnabled } from "@/lib/assistant/config";
import { runAssistantChat } from "@/lib/assistant/runner";
import type { AssistantChatRequest, AssistantMessage } from "@/lib/assistant/types";

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

/** Chat do assistente operacional — portal autenticado, tools server-side. */
export async function POST(request: Request) {
  try {
    if (!isAssistantEnabled()) {
      return NextResponse.json({ error: "Assistente desabilitado" }, { status: 503 });
    }

    const user = await requireUser();
    if (user.role !== "INTERNO") {
      return NextResponse.json(
        { error: "Assistente disponível apenas no portal interno nesta fase." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as AssistantChatRequest;
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
