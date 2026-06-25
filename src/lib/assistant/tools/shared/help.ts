import "server-only";
import type { AssistantToolDefinition } from "@/lib/assistant/types";
import type { Role } from "@/lib/roles";
import { formatKnowledgeAnswer } from "@/lib/assistant/rag/knowledge";
import { searchPortalKnowledge } from "@/lib/assistant/portal-knowledge";

export const explainCapabilityTool: AssistantToolDefinition = {
  name: "explain_capability",
  description:
    "Explica como fazer algo no portal atual (fluxos, cadastros, agendamento, faturamento) usando a base de conhecimento.",
  parameters: {
    type: "object",
    properties: {
      topic: { type: "string", description: "Tópico ou pergunta (ex: como agendar, como faturar)" },
    },
    required: ["topic"],
  },
  handler: async (ctx, args) => {
    const topic = ((args as { topic?: string }).topic ?? "").trim();
    const chunks = searchPortalKnowledge(ctx.user.role as Role, topic, ctx.labels, 3);
    return {
      topic,
      answer: formatKnowledgeAnswer(topic, chunks),
    };
  },
};
