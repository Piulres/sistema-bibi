import "server-only";
import type { NicheLabels } from "@/lib/niche/types";
import type { IncompleteDraftResult, ChoiceDraftResult } from "@/lib/assistant/types";
import {
  buildDraftGuidance,
  formatPartialSummary,
  getMissingFieldsForTool,
} from "@/lib/assistant/provider/mock-draft-flow";
import {
  type EntityOption,
} from "@/lib/assistant/resolve-entities";
import {
  formatChoiceQuestion,
  formatPartialBlock,
  resolvePatientHint,
  resolveProviderHint,
} from "@/lib/assistant/humanize";

export function buildIncompleteDraftResult(
  tool: string,
  args: Record<string, unknown>,
  labels: NicheLabels,
  missing?: string[],
  niche?: import("@/lib/niche/types").NicheId,
): IncompleteDraftResult {
  const gaps = missing ?? getMissingFieldsForTool(tool, args, niche);
  const partial = formatPartialSummary(tool, args, labels, niche);
  return {
    __assistant_incomplete: true,
    tool,
    missing: gaps,
    partial,
    guidance: buildDraftGuidance(tool, gaps, labels, partial, niche),
  };
}

export function buildResolveIncompleteResult(
  tool: string,
  error: string,
  args: Record<string, unknown>,
  labels: NicheLabels,
  niche?: import("@/lib/niche/types").NicheId,
): IncompleteDraftResult {
  const partial = formatPartialSummary(tool, args, labels, niche);
  const missing = getMissingFieldsForTool(tool, args, niche);
  return {
    __assistant_incomplete: true,
    tool,
    missing,
    partial,
    guidance:
      error +
      formatPartialBlock(partial, "Já tenho assim:") +
      (error.includes(labels.patient)
        ? resolvePatientHint(labels, (args as { patientName?: string }).patientName)
        : error.includes(labels.provider)
          ? resolveProviderHint(labels)
          : ""),
  };
}

export function buildChoiceDraftResult(input: {
  tool: string;
  field: string;
  fieldLabel: string;
  options: EntityOption[];
  draftArgs: Record<string, unknown>;
  labels: import("@/lib/niche/types").NicheLabels;
}): ChoiceDraftResult {
  const partial = formatPartialSummary(input.tool, input.draftArgs, input.labels);
  const partialBlock = formatPartialBlock(partial, "Já anotei:");

  return {
    __assistant_choices: true,
    tool: input.tool,
    field: input.field,
    fieldLabel: input.fieldLabel,
    question: `${formatChoiceQuestion(input.fieldLabel, input.options)}${partialBlock}`,
    options: input.options,
    draftArgs: input.draftArgs,
  };
}
