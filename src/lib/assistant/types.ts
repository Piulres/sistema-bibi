import type { InternoModule } from "@/lib/interno-permissions";
import type { SessionUser } from "@/lib/session";

export type AssistantMessageRole = "user" | "assistant";

export type AssistantMessage = {
  role: AssistantMessageRole;
  content: string;
};

export type AssistantAction =
  | {
      type: "link";
      label: string;
      href: string;
    }
  | {
      type: "table";
      title: string;
      columns: string[];
      rows: string[][];
    };

export type AssistantToolContext = {
  user: SessionUser;
  labels: SessionUser["labels"];
};

export type AssistantToolDefinition<TArgs = Record<string, unknown>> = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
  requiredModule?: InternoModule;
  handler: (ctx: AssistantToolContext, args: TArgs) => Promise<unknown>;
};

export type AssistantToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export type AssistantToolTrace = {
  name: string;
  ok: boolean;
  error?: string;
};

export type AssistantChatResult = {
  message: AssistantMessage;
  actions?: AssistantAction[];
  toolTrace?: AssistantToolTrace[];
};

export type AssistantChatRequest = {
  messages: AssistantMessage[];
  pageContext?: string;
};
