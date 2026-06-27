import type { OnboardingContext, OnboardingStep } from "../types";
import { buildInternoFeatures } from "../feature-map";

export function buildInternoTour(ctx: OnboardingContext): OnboardingStep[] {
  return buildInternoFeatures(ctx.labels, ctx.niche);
}
