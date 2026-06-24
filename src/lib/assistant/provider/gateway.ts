import "server-only";
import type { AssistantMessage, AssistantPlan, AssistantToolDefinition } from "@/lib/assistant/types";
import { getAssistantModel } from "@/lib/assistant/config";
import { toolsToOpenAiSchema } from "@/lib/assistant/tools/registry";

type GatewayResponse = {
  choices?: {
    message?: {
      content?: string | null;
      tool_calls?: {
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }[];
    };
  }[];
};

/** Provider Netlify AI Gateway (OpenAI-compatible). Fallback: erro → caller usa mock. */
export async function planGatewayAssistant(
  systemPrompt: string,
  messages: AssistantMessage[],
  tools: AssistantToolDefinition[],
): Promise<AssistantPlan> {
  const baseUrl = process.env.OPENAI_BASE_URL!.replace(/\/$/, "");
  const apiKey = process.env.OPENAI_API_KEY!;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getAssistantModel(),
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      tools: toolsToOpenAiSchema(tools),
      tool_choice: "auto",
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gateway error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as GatewayResponse;
  const message = data.choices?.[0]?.message;

  if (message?.tool_calls?.length) {
    return {
      toolCalls: message.tool_calls.map((call) => ({
        name: call.function.name,
        arguments: JSON.parse(call.function.arguments || "{}") as Record<string, unknown>,
      })),
    };
  }

  return {
    toolCalls: [],
    fallback: message?.content?.trim() || "Não consegui processar a solicitação.",
  };
}
