import type { AssistantMessage } from "@/lib/assistant/types";
import { jsonRequest } from "./request";

const CHAT_URL = "http://localhost/api/assistant/chat";
const CONFIRM_URL = "http://localhost/api/assistant/confirm";

export async function postAssistantChat(
  messages: AssistantMessage[],
  pageContext?: string,
): Promise<Response> {
  const { POST } = await import("@/app/api/assistant/chat/route");
  return POST(
    jsonRequest(CHAT_URL, {
      method: "POST",
      body: { messages, pageContext },
    }),
  );
}

export async function postAssistantConfirm(body: {
  pendingActionId: string;
  confirmed: boolean;
  password?: string;
}): Promise<Response> {
  const { POST } = await import("@/app/api/assistant/confirm/route");
  return POST(
    jsonRequest(CONFIRM_URL, {
      method: "POST",
      body,
    }),
  );
}

export async function parseAssistantChatResponse(res: Response) {
  const body = await res.json();
  return body as {
    message: AssistantMessage;
    actions?: { type: string; pendingActionId?: string }[];
    toolTrace?: unknown[];
  };
}
