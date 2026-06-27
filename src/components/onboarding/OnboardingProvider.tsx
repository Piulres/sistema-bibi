"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { PortalKey } from "@/lib/roles";
import type { NicheId } from "@/lib/niche/types";
import {
  buildFullTourSteps,
  buildMainTourSteps,
  buildMicroTourSteps,
} from "@/lib/onboarding/tours";
import {
  isOnboardingAutoStartEnabled,
} from "@/lib/onboarding/auto-start";
import {
  isTourCompleted,
  isTourDismissed,
  markRouteTourCompleted,
  markRouteTourDismissed,
  markTourCompleted,
  markTourDismissed,
  resetTour,
  shouldAutoStartRouteTour,
} from "@/lib/onboarding/storage";
import { getRouteScopeKey, routeStorageKey } from "@/lib/onboarding/route-scope";
import type { OnboardingStep, OnboardingTourMode } from "@/lib/onboarding/types";
import type { InternoModule } from "@/lib/interno-permissions";
import type { NicheLabels } from "@/lib/niche/types";

type OnboardingContextValue = {
  portal: PortalKey;
  active: boolean;
  tourMode: OnboardingTourMode;
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
  niche?: NicheId;
  permissions?: InternoModule[];
  children: ReactNode;
};

export function OnboardingProvider({ portal, labels, niche = "MEDICAL", permissions, children }: Props) {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tourMode, setTourMode] = useState<OnboardingTourMode>(portal === "pj" ? "full" : "main");
  const pathnameRef = useRef(pathname);

  const ctx = useMemo(
    () => ({ labels, permissions, niche }),
    [labels, permissions, niche],
  );

  const routeScope = getRouteScopeKey(portal, pathname);
  const routeKey = routeScope ? routeStorageKey(portal, routeScope) : null;

  const mainSteps = useMemo(
    () => (portal === "pj" ? [] : buildMainTourSteps(portal, ctx, pathname)),
    [portal, ctx, pathname],
  );

  const microSteps = useMemo(
    () => (portal === "pj" ? [] : buildMicroTourSteps(portal, ctx, pathname)),
    [portal, ctx, pathname],
  );

  const fullSteps = useMemo(
    () => (portal === "pj" ? buildFullTourSteps(portal, ctx, pathname) : []),
    [portal, ctx, pathname],
  );

  const steps =
    tourMode === "full" ? fullSteps : tourMode === "micro" ? microSteps : mainSteps;

  const safeIndex = steps.length > 0 ? Math.min(currentIndex, steps.length - 1) : 0;
  const currentStep = active && steps.length > 0 ? steps[safeIndex] ?? null : null;

  const endTour = useCallback(
    (completed = false) => {
      setActive(false);
      setCurrentIndex(0);

      if (completed) {
        if (tourMode === "micro" && routeKey) {
          markRouteTourCompleted(routeKey);
        } else {
          markTourCompleted(portal);
        }
        return;
      }

      if (tourMode === "micro" && routeKey) {
        markRouteTourDismissed(routeKey);
      } else {
        markTourDismissed(portal);
      }
    },
    [portal, tourMode, routeKey],
  );

  const startTour = useCallback(() => {
    resetTour(portal);
    const mode: OnboardingTourMode = portal === "pj" ? "full" : "main";
    setTourMode(mode);
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
    if (pathnameRef.current !== pathname && active) {
      setActive(false);
      setCurrentIndex(0);
    }
    pathnameRef.current = pathname;
  }, [pathname, active]);

  useEffect(() => {
    if (!isOnboardingAutoStartEnabled()) return;
    if (active) return;

    const timer = window.setTimeout(() => {
      if (portal === "pj") {
        if (!isTourCompleted(portal) && !isTourDismissed(portal) && fullSteps.length > 0) {
          setTourMode("full");
          setActive(true);
        }
        return;
      }

      if (!isTourCompleted(portal) && !isTourDismissed(portal) && mainSteps.length > 0) {
        setTourMode("main");
        setActive(true);
        return;
      }

      if (routeKey && shouldAutoStartRouteTour(routeKey) && microSteps.length > 0) {
        setTourMode("micro");
        setActive(true);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [portal, pathname, active, mainSteps.length, microSteps.length, fullSteps.length, routeKey]);

  const value: OnboardingContextValue = {
    portal,
    active,
    tourMode,
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

export function useOnboardingOptional(): OnboardingContextValue | null {
  return useContext(OnboardingContext);
}
