import type { OnboardingContext, OnboardingStep } from "../types";
import { buildPjFeatures } from "../feature-map";

export function buildPjTour(ctx: OnboardingContext): OnboardingStep[] {
  return buildPjFeatures(ctx.labels);
}
