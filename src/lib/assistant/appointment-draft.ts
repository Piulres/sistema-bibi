import "server-only";
import type { NicheLabels } from "@/lib/niche/types";
import type { ChoiceDraftResult, IncompleteDraftResult } from "@/lib/assistant/types";
import {
  buildChoiceDraftResult,
  buildIncompleteDraftResult,
  buildResolveIncompleteResult,
} from "@/lib/assistant/draft-response";
import { getMissingFieldsForTool } from "@/lib/assistant/provider/mock-draft-flow";
import {
  listAllProviderOptions,
  resolvePatientByName,
  resolveProcedureByName,
  resolveProviderByName,
} from "@/lib/assistant/resolve-entities";

export type AppointmentDraftArgs = {
  patientId?: string;
  patientName?: string;
  providerId?: string;
  providerName?: string;
  procedureId?: string;
  procedureName?: string;
  date?: string;
  time?: string;
  reason?: string;
  providerUnknown?: boolean;
  listProviders?: boolean;
  bookByProcedure?: boolean;
};

export type AppointmentDraftTool = "draft_create_appointment" | "draft_book_appointment";

function isProcedureFirst(data: AppointmentDraftArgs): boolean {
  return Boolean(data.bookByProcedure || data.procedureName || data.procedureId);
}

function hasProvider(data: AppointmentDraftArgs): boolean {
  return Boolean(data.providerId || data.providerName?.trim());
}

function shouldOfferProviderList(data: AppointmentDraftArgs): boolean {
  if (hasProvider(data)) return false;
  return Boolean(data.providerUnknown || data.listProviders || isProcedureFirst(data));
}

function readyForProviderList(data: AppointmentDraftArgs): boolean {
  if (!shouldOfferProviderList(data)) return false;
  if (!data.date?.trim() || !data.time?.trim()) return false;
  if (!data.patientId && !data.patientName?.trim()) return false;
  if (isProcedureFirst(data) && !data.procedureId && !data.procedureName?.trim()) return false;
  return true;
}

export async function resolveAppointmentDraft(input: {
  tenantId: string;
  labels: NicheLabels;
  data: AppointmentDraftArgs;
  tool?: AppointmentDraftTool;
  fixedPatientId?: string;
  fixedPatientName?: string;
}): Promise<
  | { ok: true; data: AppointmentDraftArgs; procedureLabel?: string }
  | { result: IncompleteDraftResult | ChoiceDraftResult }
> {
  const { tenantId, labels } = input;
  const tool = input.tool ?? "draft_create_appointment";
  let data = { ...input.data };

  const missing = getMissingFieldsForTool(tool, data);
  if (missing.length > 0 && !(missing.length === 1 && missing[0] === "providerPick")) {
    if (!missing.includes("providerPick") || missing.length > 1) {
      return {
        result: buildIncompleteDraftResult(tool, data, labels, missing),
      };
    }
  }

  if (input.fixedPatientId) {
    data = {
      ...data,
      patientId: input.fixedPatientId,
      patientName: input.fixedPatientName ?? data.patientName,
    };
  } else {
    const patientResult = await resolvePatientByName(tenantId, data.patientName, data.patientId);
    if (patientResult.status === "ambiguous") {
      return {
        result: buildChoiceDraftResult({
          tool,
          field: "patientId",
          fieldLabel: labels.patient.toLowerCase(),
          options: patientResult.options,
          draftArgs: data,
          labels,
        }),
      };
    }
    if (patientResult.status === "none") {
      return {
        result: buildResolveIncompleteResult(
          tool,
          `${labels.patient} não encontrado.`,
          data,
          labels,
        ),
      };
    }
    data = { ...data, patientId: patientResult.id, patientName: patientResult.label };
  }

  let procedureLabel: string | undefined;
  if (isProcedureFirst(data)) {
    const procedureResult = await resolveProcedureByName(
      tenantId,
      data.procedureName,
      data.procedureId,
    );
    if (procedureResult.status === "ambiguous") {
      return {
        result: buildChoiceDraftResult({
          tool,
          field: "procedureId",
          fieldLabel: labels.procedure.toLowerCase(),
          options: procedureResult.options,
          draftArgs: data,
          labels,
        }),
      };
    }
    if (procedureResult.status === "none") {
      return {
        result: buildResolveIncompleteResult(
          tool,
          `${labels.procedure} não encontrado no catálogo.`,
          data,
          labels,
        ),
      };
    }
    procedureLabel = procedureResult.label;
    data = { ...data, procedureId: procedureResult.id, procedureName: procedureResult.label };
  }

  if (readyForProviderList(data)) {
    const options = await listAllProviderOptions(tenantId);
    return {
      result: buildChoiceDraftResult({
        tool,
        field: "providerId",
        fieldLabel: labels.provider.toLowerCase(),
        options,
        draftArgs: data,
        labels,
      }),
    };
  }

  const postResolveMissing = getMissingFieldsForTool(tool, data);
  if (postResolveMissing.length > 0) {
    return {
      result: buildIncompleteDraftResult(tool, data, labels, postResolveMissing),
    };
  }

  const providerResult = await resolveProviderByName(
    tenantId,
    data.providerName,
    data.providerId,
  );
  if (providerResult.status === "ambiguous") {
    return {
      result: buildChoiceDraftResult({
        tool,
        field: "providerId",
        fieldLabel: labels.provider.toLowerCase(),
        options: providerResult.options,
        draftArgs: data,
        labels,
      }),
    };
  }
  if (providerResult.status === "none") {
    return {
      result: buildResolveIncompleteResult(
        tool,
        `${labels.provider} não encontrado.`,
        data,
        labels,
      ),
    };
  }

  data = { ...data, providerId: providerResult.id, providerName: providerResult.label };
  return { ok: true, data, procedureLabel };
}
