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
    }
  | {
      type: "choice";
      title: string;
      field: string;
      options: { label: string; value: string }[];
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
        petId?: string | null;
        providerId?: string;
        procedureId?: string;
        scheduledAt: string;
        reason?: string | null;
        autoAssignProvider?: boolean;
      };
    }
  | {
      type: "book_appointment";
      data: {
        patientId: string;
        petId?: string | null;
        providerId?: string;
        procedureId?: string;
        scheduledAt: string;
        reason?: string | null;
        autoAssignProvider?: boolean;
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

export type ChoiceDraftResult = {
  __assistant_choices: true;
  tool: string;
  field: string;
  fieldLabel: string;
  question: string;
  options: { id: string; label: string; detail?: string }[];
  draftArgs: Record<string, unknown>;
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

export function isChoiceDraftResult(value: unknown): value is ChoiceDraftResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "__assistant_choices" in value &&
    (value as ChoiceDraftResult).__assistant_choices === true
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
  /** Token para continuar drafts multi-turno entre requisições (serverless). */
  sessionState?: string;
};

export type AssistantChatRequest = {
  messages: AssistantMessage[];
  pageContext?: string;
  /** Estado do assistente (draft multi-turno) — token assinado retornado na resposta anterior. */
  sessionState?: string;
};

export type AssistantConfirmRequest = {
  pendingActionId: string;
  confirmed: boolean;
  password?: string;
};

/** Valida action vinda da API antes de renderizar no cliente (dev/serialização). */
export function isAssistantAction(value: unknown): value is AssistantAction {
  if (!value || typeof value !== "object" || !("type" in value)) return false;
  const action = value as AssistantAction;
  switch (action.type) {
    case "link":
      return typeof action.label === "string" && typeof action.href === "string";
    case "table":
      return (
        typeof action.title === "string" &&
        Array.isArray(action.columns) &&
        Array.isArray(action.rows)
      );
    case "confirm":
      return (
        typeof action.title === "string" &&
        typeof action.pendingActionId === "string" &&
        typeof action.summary === "object" &&
        action.summary !== null
      );
    case "choice":
      return (
        typeof action.title === "string" &&
        typeof action.field === "string" &&
        Array.isArray(action.options)
      );
    case "form_draft":
      return typeof action.label === "string" && typeof action.href === "string";
    default:
      return false;
  }
}

export function filterAssistantActions(actions: unknown): AssistantAction[] {
  if (!Array.isArray(actions)) return [];
  return actions.filter(isAssistantAction);
}
