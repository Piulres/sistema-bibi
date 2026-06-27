import type { PortalKey } from "@/lib/roles";
import type { OnboardingContext, OnboardingStep } from "../types";
import { matchesRoute } from "../match-route";
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

const MAIN_MAX_ORDER = 99;

function sortSteps(steps: OnboardingStep[]): OnboardingStep[] {
  return [...steps].sort((a, b) => (a.order ?? 500) - (b.order ?? 500));
}

function permitSteps(portal: PortalKey, ctx: OnboardingContext): OnboardingStep[] {
  const raw = BUILDERS[portal](ctx);
  return portal === "interno" ? filterByPermissions(raw, ctx.permissions) : raw;
}

function dedupeContentFallback(steps: OnboardingStep[]): OnboardingStep[] {
  const specificTargets = new Set(
    steps.filter((s) => s.route && s.id.startsWith("page-")).map((s) => s.target),
  );
  return steps.filter((step) => step.id !== "content-fallback" || !specificTargets.has(step.target));
}

/** Tour principal — intro + nav condensado + assistente (sem passos por rota). */
export function buildMainTourSteps(
  portal: PortalKey,
  ctx: OnboardingContext,
  pathname: string,
): OnboardingStep[] {
  const permitted = permitSteps(portal, ctx);
  const main = permitted.filter((s) => !s.route && (s.order ?? 500) <= MAIN_MAX_ORDER);

  const landingPage = permitted.filter(
    (s) =>
      s.route &&
      matchesRoute(pathname, s.route) &&
      s.id.startsWith("page-") &&
      (s.order ?? 500) < 110,
  );

  return dedupeContentFallback(sortSteps([...main, ...landingPage]));
}

/** Micro-tour — hotspots e detalhes da rota atual (primeira visita ao módulo). */
export function buildMicroTourSteps(
  portal: PortalKey,
  ctx: OnboardingContext,
  pathname: string,
): OnboardingStep[] {
  const permitted = permitSteps(portal, ctx);
  const micro = permitted.filter(
    (s) => s.route && matchesRoute(pathname, s.route) && (s.order ?? 500) >= 100,
  );
  return dedupeContentFallback(sortSteps(micro));
}

/** Portal PJ — página única; todos os passos de uma vez. */
export function buildFullTourSteps(
  portal: PortalKey,
  ctx: OnboardingContext,
  pathname: string,
): OnboardingStep[] {
  return buildTourSteps(portal, ctx, pathname);
}

/** Monta passos legados com labels, RBAC e filtro por rota. */
export function buildTourSteps(
  portal: PortalKey,
  ctx: OnboardingContext,
  pathname: string,
): OnboardingStep[] {
  const permitted = permitSteps(portal, ctx);
  const routeFiltered = permitted.filter((step) => matchesRoute(pathname, step.route));

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
