"use client";

import { useOnboardingOptional } from "@/components/onboarding/OnboardingProvider";
import Button from "@/components/ui/Button";

/** Botão para reiniciar o tour guiado — exibido no header do portal. */
export default function OnboardingTrigger() {
  const onboarding = useOnboardingOptional();

  if (!onboarding) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onboarding.startTour}
      title="Iniciar tour guiado"
      aria-label="Iniciar tour guiado"
      className="inline-flex min-h-9 min-w-9 justify-center px-2 sm:px-3"
      data-testid="onboarding-trigger"
      data-tour-id="onboarding-trigger"
    >
      <span aria-hidden className="sm:mr-1">
        ?
      </span>
      <span className="hidden sm:inline">Tour</span>
    </Button>
  );
}
