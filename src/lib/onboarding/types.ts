import type { PortalKey } from "@/lib/roles";
import type { NicheId, NicheLabels } from "@/lib/niche/types";
import type { InternoModule } from "@/lib/interno-permissions";

export const ONBOARDING_VERSION = 3;

export type OnboardingPlacement = "top" | "bottom" | "left" | "right" | "auto";

export type OnboardingTourMode = "main" | "micro" | "full";

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
  /** Ordem de exibição (menor = antes). <100 = tour principal; ≥100 = micro-tour por rota. */
  order?: number;
  /** CTA opcional — navega e avança o tour. */
  navigateTo?: string;
};

export type OnboardingTourConfig = {
  portal: PortalKey;
  steps: OnboardingStep[];
};

export type OnboardingContext = {
  labels: NicheLabels;
  permissions?: InternoModule[];
  niche?: NicheId;
};

export type OnboardingProgress = {
  completed: boolean;
  version: number;
  completedAt?: string;
  /** Usuário pulou/fechou o tour principal — não auto-iniciar de novo. */
  dismissed?: boolean;
};

export type OnboardingState = Partial<Record<PortalKey, OnboardingProgress>> & {
  routes?: Record<string, OnboardingProgress>;
};
