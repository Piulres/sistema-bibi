import type { PortalKey } from "@/lib/roles";
import { ONBOARDING_VERSION, type OnboardingProgress, type OnboardingState } from "./types";

const STORAGE_KEY = "bibi_onboarding";

function readState(): OnboardingState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return {};
  }
}

function writeState(state: OnboardingState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function routeProgress(key: string): OnboardingProgress | undefined {
  return readState().routes?.[key];
}

export function isTourCompleted(portal: PortalKey, version = ONBOARDING_VERSION): boolean {
  const progress = readState()[portal];
  return Boolean(progress?.completed && progress.version >= version);
}

export function isTourDismissed(portal: PortalKey): boolean {
  return Boolean(readState()[portal]?.dismissed);
}

export function isRouteTourCompleted(routeKey: string, version = ONBOARDING_VERSION): boolean {
  const progress = routeProgress(routeKey);
  return Boolean(progress?.completed && progress.version >= version);
}

export function isRouteTourDismissed(routeKey: string): boolean {
  return Boolean(routeProgress(routeKey)?.dismissed);
}

export function shouldAutoStartRouteTour(routeKey: string): boolean {
  return !isRouteTourCompleted(routeKey) && !isRouteTourDismissed(routeKey);
}

export function markTourCompleted(portal: PortalKey, version = ONBOARDING_VERSION): void {
  const state = readState();
  state[portal] = {
    completed: true,
    version,
    completedAt: new Date().toISOString(),
    dismissed: false,
  };
  writeState(state);
}

export function markTourDismissed(portal: PortalKey, version = ONBOARDING_VERSION): void {
  const state = readState();
  state[portal] = {
    completed: false,
    version,
    dismissed: true,
  };
  writeState(state);
}

export function markRouteTourCompleted(routeKey: string, version = ONBOARDING_VERSION): void {
  const state = readState();
  state.routes = state.routes ?? {};
  state.routes[routeKey] = {
    completed: true,
    version,
    completedAt: new Date().toISOString(),
    dismissed: false,
  };
  writeState(state);
}

export function markRouteTourDismissed(routeKey: string, version = ONBOARDING_VERSION): void {
  const state = readState();
  state.routes = state.routes ?? {};
  state.routes[routeKey] = {
    completed: false,
    version,
    dismissed: true,
  };
  writeState(state);
}

export function resetTour(portal: PortalKey): void {
  const state = readState();
  delete state[portal];
  if (state.routes) {
    const prefix = `${portal}:`;
    for (const key of Object.keys(state.routes)) {
      if (key.startsWith(prefix)) delete state.routes[key];
    }
  }
  writeState(state);
}

export function resetAllTours(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getTourProgress(portal: PortalKey): OnboardingProgress | undefined {
  return readState()[portal];
}

/** Para testes — injeta estado sem localStorage. */
export function _parseState(raw: string | null): OnboardingState {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return {};
  }
}
