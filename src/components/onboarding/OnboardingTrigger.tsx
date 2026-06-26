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
      className="hidden sm:inline-flex"
      data-tour-id="onboarding-trigger"
    >
      <span aria-hidden className="mr-1">
        ?
      </span>
      Tour
    </Button>
  );
}
