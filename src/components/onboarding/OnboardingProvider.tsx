"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { PortalKey } from "@/lib/roles";
import { buildTourSteps } from "@/lib/onboarding/tours";
import { isTourCompleted, markTourCompleted, resetTour } from "@/lib/onboarding/storage";
import type { OnboardingStep } from "@/lib/onboarding/types";
import type { InternoModule } from "@/lib/interno-permissions";
import type { NicheLabels } from "@/lib/niche/types";

type OnboardingContextValue = {
  portal: PortalKey;
  active: boolean;
  steps: OnboardingStep[];
  currentIndex: number;
  currentStep: OnboardingStep | null;
  totalSteps: number;
  startTour: () => void;
  endTour: (completed?: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

type Props = {
  portal: PortalKey;
  labels: NicheLabels;
  permissions?: InternoModule[];
  children: ReactNode;
};

export function OnboardingProvider({ portal, labels, permissions, children }: Props) {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const steps = useMemo(
    () => buildTourSteps(portal, { labels, permissions }, pathname),
    [portal, labels, permissions, pathname],
  );

  const safeIndex = steps.length > 0 ? Math.min(currentIndex, steps.length - 1) : 0;
  const currentStep = active && steps.length > 0 ? steps[safeIndex] ?? null : null;

  const endTour = useCallback(
    (completed = false) => {
      setActive(false);
      setCurrentIndex(0);
      if (completed) {
        markTourCompleted(portal);
      }
    },
    [portal],
  );

  const startTour = useCallback(() => {
    resetTour(portal);
    setCurrentIndex(0);
    setActive(true);
  }, [portal]);

  const nextStep = useCallback(() => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      endTour(true);
    }
  }, [currentIndex, steps.length, endTour]);

  const prevStep = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < steps.length) {
        setCurrentIndex(index);
      }
    },
    [steps.length],
  );

  useEffect(() => {
    if (steps.length === 0) return;
    if (!isTourCompleted(portal)) {
      const timer = window.setTimeout(() => setActive(true), 800);
      return () => window.clearTimeout(timer);
    }
  }, [portal, steps.length]);

  const value: OnboardingContextValue = {
    portal,
    active,
    steps,
    currentIndex: safeIndex,
    currentStep,
    totalSteps: steps.length,
    startTour,
    endTour,
    nextStep,
    prevStep,
    goToStep,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}

/** Versão segura para componentes opcionais (ex.: header). */
export function useOnboardingOptional(): OnboardingContextValue | null {
  return useContext(OnboardingContext);
}
