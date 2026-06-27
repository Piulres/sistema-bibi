import "server-only";
import type { NicheId } from "@/lib/niche/types";
import type { NicheLabels } from "@/lib/niche/types";
import type { ChoiceDraftResult, IncompleteDraftResult } from "@/lib/assistant/types";
import {
  buildChoiceDraftResult,
  buildIncompleteDraftResult,
  buildResolveIncompleteResult,
} from "@/lib/assistant/draft-response";
import { getMissingFieldsForTool } from "@/lib/assistant/provider/mock-draft-flow";
import { matchProcedureNameInText } from "@/lib/assistant/procedure-match";
import { requiresPet } from "@/lib/vet-niche";
import {
  listAllProviderOptions,
  listPetsForPatient,
  resolvePatientByName,
  resolvePetByName,
  resolveProcedureByName,
  resolveProviderByName,
} from "@/lib/assistant/resolve-entities";

export type AppointmentDraftArgs = {
  patientId?: string;
  patientName?: string;
  petId?: string;
  petName?: string;
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

function readyForProviderList(data: AppointmentDraftArgs, needsPet: boolean): boolean {
  if (!shouldOfferProviderList(data)) return false;
  if (!data.date?.trim() || !data.time?.trim()) return false;
  if (!data.patientId && !data.patientName?.trim()) return false;
  if (needsPet && !data.petId && !data.petName?.trim()) return false;
  if (isProcedureFirst(data) && !data.procedureId && !data.procedureName?.trim()) return false;
  return true;
}

async function enrichProcedureFromCatalog(
  tenantId: string,
  data: AppointmentDraftArgs,
  rawHint?: string,
): Promise<AppointmentDraftArgs> {
  if (data.procedureId || data.procedureName) return data;
  const hint = rawHint ?? data.reason ?? "";
  const matched = await matchProcedureNameInText(tenantId, hint);
  if (!matched) return data;
  return { ...data, procedureName: matched, bookByProcedure: true };
}

export async function resolveAppointmentDraft(input: {
  tenantId: string;
  niche: NicheId;
  labels: NicheLabels;
  data: AppointmentDraftArgs;
  tool?: AppointmentDraftTool;
  fixedPatientId?: string;
  fixedPatientName?: string;
  rawUserText?: string;
}): Promise<
  | { ok: true; data: AppointmentDraftArgs; procedureLabel?: string; petLabel?: string }
  | { result: IncompleteDraftResult | ChoiceDraftResult }
> {
  const { tenantId, labels, niche } = input;
  const tool = input.tool ?? "draft_create_appointment";
  const needsPet = requiresPet(niche);
  let data = await enrichProcedureFromCatalog(tenantId, { ...input.data }, input.rawUserText);

  const missing = getMissingFieldsForTool(tool, data, niche);
  if (missing.length > 0 && !(missing.length === 1 && missing[0] === "providerPick")) {
    if (!missing.includes("providerPick") || missing.length > 1) {
      return {
        result: buildIncompleteDraftResult(tool, data, labels, missing, niche),
      };
    }
  }

  if (input.fixedPatientId) {
    data = {
      ...data,
      patientId: input.fixedPatientId,
      patientName: input.fixedPatientName ?? data.patientName,
    };
  } else if (tool === "draft_create_appointment" || needsPet) {
    const patientResult = await resolvePatientByName(tenantId, data.patientName, data.patientId);
    const entityLabel = needsPet ? labels.beneficiary : labels.patient;
    if (patientResult.status === "ambiguous") {
      return {
        result: buildChoiceDraftResult({
          tool,
          field: "patientId",
          fieldLabel: entityLabel.toLowerCase(),
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
          `${entityLabel} não encontrado.`,
          data,
          labels,
          niche,
        ),
      };
    }
    data = { ...data, patientId: patientResult.id, patientName: patientResult.label };
  }

  let petLabel: string | undefined;
  if (needsPet && data.patientId) {
    if (!data.petId && !data.petName?.trim()) {
      const pets = await listPetsForPatient(tenantId, data.patientId);
      if (pets.length === 1) {
        data = { ...data, petId: pets[0]!.id, petName: pets[0]!.label };
        petLabel = pets[0]!.label;
      } else if (pets.length > 1) {
        return {
          result: buildChoiceDraftResult({
            tool,
            field: "petId",
            fieldLabel: labels.patient.toLowerCase(),
            options: pets,
            draftArgs: data,
            labels,
          }),
        };
      }
    }

    if (data.petId || data.petName?.trim()) {
      const petResult = await resolvePetByName(
        tenantId,
        data.patientId,
        data.petName,
        data.petId,
      );
      if (petResult.status === "ambiguous") {
        return {
          result: buildChoiceDraftResult({
            tool,
            field: "petId",
            fieldLabel: labels.patient.toLowerCase(),
            options: petResult.options,
            draftArgs: data,
            labels,
          }),
        };
      }
      if (petResult.status === "none") {
        return {
          result: buildResolveIncompleteResult(
            tool,
            `${labels.patient} não encontrado para este ${labels.beneficiary.toLowerCase()}.`,
            data,
            labels,
            niche,
          ),
        };
      }
      petLabel = petResult.label;
      data = { ...data, petId: petResult.id, petName: petResult.label };
    }

    const petMissing = getMissingFieldsForTool(tool, data, niche);
    if (petMissing.includes("petName")) {
      return {
        result: buildIncompleteDraftResult(tool, data, labels, petMissing, niche),
      };
    }
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
          niche,
        ),
      };
    }
    procedureLabel = procedureResult.label;
    data = { ...data, procedureId: procedureResult.id, procedureName: procedureResult.label };
  }

  if (readyForProviderList(data, needsPet)) {
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

  const postResolveMissing = getMissingFieldsForTool(tool, data, niche);
  if (postResolveMissing.length > 0) {
    return {
      result: buildIncompleteDraftResult(tool, data, labels, postResolveMissing, niche),
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
        niche,
      ),
    };
  }

  data = { ...data, providerId: providerResult.id, providerName: providerResult.label };
  return { ok: true, data, procedureLabel, petLabel };
}
