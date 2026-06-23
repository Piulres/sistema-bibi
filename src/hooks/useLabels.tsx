"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getDefaultLabels } from "@/lib/niche/defaults";
import type { NicheId, NicheLabelKey, NicheLabels } from "@/lib/niche/types";

export type LabelsContextValue = {
  niche: NicheId;
  labels: NicheLabels;
  /** Atalho tipado — preferir `labels.patient` ou `t("patient")`. */
  t: (key: NicheLabelKey) => string;
};

const FALLBACK: LabelsContextValue = {
  niche: "MEDICAL",
  labels: getDefaultLabels("MEDICAL"),
  t: (key) => getDefaultLabels("MEDICAL")[key],
};

const LabelsContext = createContext<LabelsContextValue>(FALLBACK);

type ProviderProps = {
  niche: NicheId;
  labels: NicheLabels;
  children: ReactNode;
};

/** Provider de labels do tenant — injetado em `PortalShell`. */
export function NicheProvider({ niche, labels, children }: ProviderProps) {
  const value: LabelsContextValue = {
    niche,
    labels,
    t: (key) => labels[key],
  };
  return <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>;
}

/**
 * Hook principal de tradução por nicho (ServiceOS v2.0).
 * Use `labels.patient` em JSX em vez de strings fixas como "Paciente".
 */
export function useLabels(): LabelsContextValue {
  return useContext(LabelsContext);
}

/** @deprecated Prefer `useLabels()` — alias mantido para compatibilidade. */
export const useNiche = useLabels;
