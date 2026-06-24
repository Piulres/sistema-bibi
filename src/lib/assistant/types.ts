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
    }
  | {
      type: "confirm";
      title: string;
      summary: Record<string, string>;
      pendingActionId: string;
    }
  | {
      type: "form_draft";
      label: string;
      href: string;
      fields: Record<string, string>;
    };

export type PendingActionType =
  | "create_user"
  | "create_patient"
  | "create_appointment"
  | "book_appointment";

export type PendingActionPayload =
  | {
      type: "create_user";
      data: {
        email: string;
        password: string;
        name: string;
        role: string;
        internoProfile?: string | null;
        companyId?: string | null;
        patientId?: string | null;
      };
    }
  | {
      type: "create_patient";
      data: {
        name: string;
        cpf: string;
        birthDate: string;
        phone?: string | null;
        email?: string | null;
        companyId?: string | null;
      };
    }
  | {
      type: "create_appointment";
      data: {
        patientId: string;
        providerId: string;
        scheduledAt: string;
        reason?: string | null;
      };
    }
  | {
      type: "book_appointment";
      data: {
        patientId: string;
        providerId: string;
        scheduledAt: string;
        reason?: string | null;
      };
    };

export type DraftToolResult = {
  __assistant_pending: true;
  pendingActionId: string;
  preview: string;
  summary: Record<string, string>;
  href?: string;
};

export type IncompleteDraftResult = {
  __assistant_incomplete: true;
  tool: string;
  missing: string[];
  partial: Record<string, string>;
  guidance: string;
};

export function isDraftToolResult(value: unknown): value is DraftToolResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "__assistant_pending" in value &&
    (value as DraftToolResult).__assistant_pending === true
  );
}

export function isIncompleteDraftResult(value: unknown): value is IncompleteDraftResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "__assistant_incomplete" in value &&
    (value as IncompleteDraftResult).__assistant_incomplete === true
  );
}

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
  requiredRoles?: string[];
  kind?: "read" | "draft";
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

export type AssistantPlan = {
  toolCalls: AssistantToolCall[];
  fallback?: string;
};

export type AssistantChatResult = {
  message: AssistantMessage;
  actions?: AssistantAction[];
  pendingActionId?: string;
  toolTrace?: AssistantToolTrace[];
};

export type AssistantChatRequest = {
  messages: AssistantMessage[];
  pageContext?: string;
};

export type AssistantConfirmRequest = {
  pendingActionId: string;
  confirmed: boolean;
  password?: string;
};
