import type { PortalKey } from "@/lib/roles";
import type { OnboardingContext, OnboardingStep } from "../types";
import { filterStepsForRoute } from "../match-route";
import { filterByPermissions } from "../feature-map";
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

function sortSteps(steps: OnboardingStep[]): OnboardingStep[] {
  return [...steps].sort((a, b) => (a.order ?? 500) - (b.order ?? 500));
}

/** Monta passos do tour com labels, RBAC e filtro por rota. */
export function buildTourSteps(
  portal: PortalKey,
  ctx: OnboardingContext,
  pathname: string,
): OnboardingStep[] {
  const raw = BUILDERS[portal](ctx);
  const permitted =
    portal === "interno" ? filterByPermissions(raw, ctx.permissions) : raw;

  const routeFiltered = filterStepsForRoute(permitted, pathname);

  const specificTargets = new Set(
    routeFiltered.filter((s) => s.route).map((s) => s.target),
  );

  const deduped = routeFiltered.filter(
    (step) => step.route || !specificTargets.has(step.target),
  );

  return sortSteps(deduped);
}

/** Contagem de passos por portal (para testes e documentação). */
export function countTourSteps(portal: PortalKey, ctx: OnboardingContext): number {
  return BUILDERS[portal](ctx).length;
}
