import type { PortalKey } from "@/lib/roles";
import type { NicheLabels } from "@/lib/niche/types";
import type { InternoModule } from "@/lib/interno-permissions";

export const ONBOARDING_VERSION = 2;

export type OnboardingPlacement = "top" | "bottom" | "left" | "right" | "auto";

export type OnboardingStep = {
  id: string;
  /** Seletor CSS — preferir `[data-tour-id="…"]`. */
  target: string;
  title: string;
  content: string;
  placement?: OnboardingPlacement;
  /** Exibir apenas nesta rota (pathname exato ou prefixo com `*`). */
  route?: string;
  /** Módulo interno — filtra passo conforme RBAC do usuário. */
  module?: InternoModule;
  /** Ordem de exibição (menor = antes). */
  order?: number;
};

export type OnboardingTourConfig = {
  portal: PortalKey;
  steps: OnboardingStep[];
};

export type OnboardingContext = {
  labels: NicheLabels;
  permissions?: InternoModule[];
};

export type OnboardingProgress = {
  completed: boolean;
  version: number;
  completedAt?: string;
};

export type OnboardingState = Partial<Record<PortalKey, OnboardingProgress>>;
