import "server-only";
import { recordTimelineEvent } from "@/lib/timeline";
import type { SessionUser } from "@/lib/session";

/** Registra uso de ferramenta do assistente na timeline (analytics operacional). */
export async function recordAssistantToolUse(
  user: SessionUser,
  toolName: string,
  ok: boolean,
  pageContext?: string,
): Promise<void> {
  await recordTimelineEvent({
    tenantId: user.tenantId,
    entityType: "Assistant",
    entityId: user.id,
    action: ok ? "ASSISTANT_TOOL_OK" : "ASSISTANT_TOOL_ERR",
    description: ok
      ? `Assistente: ${toolName}${pageContext ? ` (${pageContext})` : ""}`
      : `Assistente falhou: ${toolName}`,
    createdBy: user.id,
    metadata: {
      tool: toolName,
      role: user.role,
      niche: user.niche,
      pageContext: pageContext ?? null,
      ok,
    },
  });
}
