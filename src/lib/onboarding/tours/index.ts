import type { PortalKey } from "@/lib/roles";
import type { OnboardingContext, OnboardingStep } from "../types";
import { filterStepsForRoute } from "../match-route";
import { buildInternoTour } from "./interno";
import { buildPrestadorTour } from "./prestador";
import { buildPjTour } from "./pj";
import { buildBeneficiarioTour } from "./beneficiario";

const BUILDERS: Record<PortalKey, (ctx: OnboardingContext) => OnboardingStep[]> = {
  interno: buildInternoTour,
  prestador: buildPrestadorTour,
  pj: buildPjTour,
  beneficiario: buildBeneficiarioTour,
};

/** Monta passos do tour com labels do nicho e filtra pela rota. */
export function buildTourSteps(
  portal: PortalKey,
  ctx: OnboardingContext,
  pathname: string,
): OnboardingStep[] {
  const all = BUILDERS[portal](ctx);

  const routeFiltered = filterStepsForRoute(all, pathname);

  const specificTargets = new Set(
    routeFiltered.filter((s) => s.route).map((s) => s.target),
  );

  return routeFiltered.filter((step) => step.route || !specificTargets.has(step.target));
}
