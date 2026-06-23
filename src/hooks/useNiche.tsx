"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { NicheId, NicheLabelKey, NicheLabels } from "@/lib/niche/types";
import { getDefaultLabels } from "@/lib/niche/defaults";

export type NicheContextValue = {
  niche: NicheId;
  labels: NicheLabels;
  t: (key: NicheLabelKey) => string;
};

const FALLBACK: NicheContextValue = {
  niche: "MEDICAL",
  labels: getDefaultLabels("MEDICAL"),
  t: (key) => getDefaultLabels("MEDICAL")[key],
};

const NicheContext = createContext<NicheContextValue>(FALLBACK);

type ProviderProps = {
  niche: NicheId;
  labels: NicheLabels;
  children: ReactNode;
};

export function NicheProvider({ niche, labels, children }: ProviderProps) {
  const value: NicheContextValue = {
    niche,
    labels,
    t: (key) => labels[key],
  };
  return <NicheContext.Provider value={value}>{children}</NicheContext.Provider>;
}

/** Traduz termos da UI conforme o nicho do tenant (ServiceOS v2.0). */
export function useNiche(): NicheContextValue {
  return useContext(NicheContext);
}
