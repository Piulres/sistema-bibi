import "server-only";
import type { NicheLabels } from "@/lib/niche/types";
import type { IncompleteDraftResult } from "@/lib/assistant/types";
import {
  buildDraftGuidance,
  formatPartialSummary,
  getMissingFieldsForTool,
} from "@/lib/assistant/provider/mock-draft-flow";

export function buildIncompleteDraftResult(
  tool: string,
  args: Record<string, unknown>,
  labels: NicheLabels,
  missing?: string[],
): IncompleteDraftResult {
  const gaps = missing ?? getMissingFieldsForTool(tool, args);
  const partial = formatPartialSummary(tool, args, labels);
  return {
    __assistant_incomplete: true,
    tool,
    missing: gaps,
    partial,
    guidance: buildDraftGuidance(tool, gaps, labels, partial),
  };
}

export function buildResolveIncompleteResult(
  tool: string,
  error: string,
  args: Record<string, unknown>,
  labels: NicheLabels,
): IncompleteDraftResult {
  const partial = formatPartialSummary(tool, args, labels);
  const missing = getMissingFieldsForTool(tool, args);
  return {
    __assistant_incomplete: true,
    tool,
    missing,
    partial,
    guidance:
      error +
      (Object.keys(partial).length
        ? `\n\nAté agora:\n${Object.entries(partial)
            .map(([k, v]) => `• ${k}: ${v}`)
            .join("\n")}`
        : "") +
      (error.includes(labels.patient)
        ? `\n\nConfira o nome ou tente: *buscar paciente ${(args as { patientName?: string }).patientName ?? "..."}*.`
        : error.includes(labels.provider)
          ? `\n\nInforme o ${labels.provider.toLowerCase()}, ex.: *com Dra. Helena*.`
          : ""),
  };
}
