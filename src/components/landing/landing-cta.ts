import { cn } from "@/lib/utils/cn";

export type LandingCtaVariant = "surface" | "hero" | "hero-ghost";
export type LandingCtaSize = "sm" | "md" | "lg";

/** Classes unificadas dos CTAs da landing (header, hero, bloco final). */
export function landingCtaClasses(
  variant: LandingCtaVariant,
  size: LandingCtaSize = "md",
  className?: string,
): string {
  return cn("landing-cta", `landing-cta--${variant}`, `landing-cta--${size}`, className);
}
