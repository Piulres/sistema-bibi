import "server-only";
import type { NicheLabels } from "@/lib/niche/types";
import {
  buildDraftGuidanceText,
  buildResolveErrorGuidance as humanizeResolveError,
  draftFieldPrompt,
} from "@/lib/assistant/humanize";

export const DRAFT_TOOL_NAMES = new Set([
  "draft_create_user",
  "draft_create_patient",
  "draft_create_appointment",
  "draft_book_appointment",
]);

export function isDraftToolName(tool: string | null | undefined): boolean {
  return Boolean(tool && DRAFT_TOOL_NAMES.has(tool));
}

export type OperationDraftArgs = Record<string, unknown>;

export function mergeDraftArgs(
  existing: OperationDraftArgs,
  incoming: OperationDraftArgs,
): OperationDraftArgs {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined || value === null || value === "") continue;
    merged[key] = value;
  }
  return merged;
}

export function stripDraftMeta(args: OperationDraftArgs): OperationDraftArgs {
  return args;
}

type AppointmentArgs = {
  patientName?: string;
  patientId?: string;
  providerName?: string;
  providerId?: string;
  procedureName?: string;
  procedureId?: string;
  date?: string;
  time?: string;
  providerUnknown?: boolean;
  listProviders?: boolean;
  bookByProcedure?: boolean;
};

function isProcedureFirst(data: AppointmentArgs): boolean {
  return Boolean(data.bookByProcedure || data.procedureName || data.procedureId);
}

function hasProvider(data: AppointmentArgs): boolean {
  return Boolean(data.providerId || data.providerName?.trim());
}

function shouldSkipProviderName(data: AppointmentArgs): boolean {
  if (hasProvider(data)) return true;
  return Boolean(data.providerUnknown || data.listProviders || isProcedureFirst(data));
}

function readyForProviderPick(data: AppointmentArgs, tool: string): boolean {
  if (!shouldSkipProviderName(data) || hasProvider(data)) return false;
  const hasPatient =
    tool === "draft_book_appointment" || Boolean(data.patientId || data.patientName?.trim());
  const hasProcedureOk =
    !isProcedureFirst(data) || Boolean(data.procedureId || data.procedureName?.trim());
  return Boolean(hasPatient && data.date?.trim() && data.time?.trim() && hasProcedureOk);
}

export function getMissingFieldsForTool(
  tool: string,
  args: OperationDraftArgs,
): string[] {
  switch (tool) {
    case "draft_create_appointment":
    case "draft_book_appointment": {
      const data = args as AppointmentArgs;
      const missing: string[] = [];
      if (tool === "draft_create_appointment" && !data.patientName?.trim() && !data.patientId) {
        missing.push("patientName");
      }
      if (isProcedureFirst(data) && !data.procedureName?.trim() && !data.procedureId) {
        missing.push("procedureName");
      }
      if (readyForProviderPick(data, tool)) {
        missing.push("providerPick");
      } else if (!shouldSkipProviderName(data) && !hasProvider(data)) {
        missing.push("providerName");
      }
      if (!data.date?.trim()) missing.push("date");
      if (!data.time?.trim()) missing.push("time");
      return missing;
    }
    case "draft_create_user": {
      const missing: string[] = [];
      const data = args as { name?: string; email?: string; password?: string; role?: string };
      if (!data.name?.trim()) missing.push("name");
      if (!data.email?.trim()) missing.push("email");
      if (!data.password?.trim()) missing.push("password");
      if (!data.role?.trim()) missing.push("role");
      return missing;
    }
    case "draft_create_patient": {
      const missing: string[] = [];
      const data = args as { name?: string; cpf?: string; birthDate?: string };
      if (!data.name?.trim()) missing.push("name");
      if (!data.cpf?.trim()) missing.push("cpf");
      if (!data.birthDate?.trim()) missing.push("birthDate");
      return missing;
    }
    default:
      return [];
  }
}

export function buildDraftGuidance(
  tool: string,
  missing: string[],
  labels: NicheLabels,
  partial: Record<string, string>,
): string {
  return buildDraftGuidanceText({ tool, missing, labels, partial });
}

export function formatPartialSummary(
  tool: string,
  args: OperationDraftArgs,
  labels: NicheLabels,
): Record<string, string> {
  switch (tool) {
    case "draft_create_appointment":
    case "draft_book_appointment": {
      const data = args as AppointmentArgs;
      const partial: Record<string, string> = {};
      if (data.patientName) partial[labels.patient] = data.patientName;
      if (data.providerName) partial[labels.provider] = data.providerName;
      if (data.procedureName) partial[labels.procedure] = data.procedureName;
      if (data.date) partial.Data = data.date;
      if (data.time) partial.Horário = data.time;
      if (data.providerUnknown || data.listProviders) {
        partial["Prestador"] = "a escolher na lista";
      }
      return partial;
    }
    case "draft_create_user": {
      const data = args as { name?: string; email?: string; role?: string };
      const partial: Record<string, string> = {};
      if (data.name) partial.Nome = data.name;
      if (data.email) partial["E-mail"] = data.email;
      if (data.role) partial.Perfil = data.role;
      return partial;
    }
    case "draft_create_patient": {
      const data = args as { name?: string; cpf?: string; birthDate?: string };
      const partial: Record<string, string> = {};
      if (data.name) partial.Nome = data.name;
      if (data.cpf) partial.CPF = data.cpf;
      if (data.birthDate) partial.Nascimento = data.birthDate;
      return partial;
    }
    default:
      return {};
  }
}

export function buildResolveErrorGuidance(
  tool: string,
  error: string,
  args: OperationDraftArgs,
  labels: NicheLabels,
): string {
  const partial = formatPartialSummary(tool, args, labels);
  return humanizeResolveError(error, partial, labels);
}

export { draftFieldPrompt };
