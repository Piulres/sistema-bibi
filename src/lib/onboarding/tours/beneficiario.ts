import type { OnboardingContext, OnboardingStep } from "../types";
import { buildBeneficiarioFeatures } from "../feature-map";

export function buildBeneficiarioTour(ctx: OnboardingContext): OnboardingStep[] {
  return buildBeneficiarioFeatures(ctx.labels);
}
