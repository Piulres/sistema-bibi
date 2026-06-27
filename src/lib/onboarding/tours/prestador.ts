import type { OnboardingContext, OnboardingStep } from "../types";
import { buildPrestadorFeatures } from "../feature-map";

export function buildPrestadorTour(ctx: OnboardingContext): OnboardingStep[] {
  return buildPrestadorFeatures(ctx.labels, ctx.niche);
}
