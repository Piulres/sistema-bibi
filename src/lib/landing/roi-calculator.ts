/** Presets de ROI por segmento — alinhados a `docs/plataforma/ROI_REFERENCIA.md` e pesquisas de nicho. */
export type RoiSegmentKey =
  | "MEDICAL"
  | "VET"
  | "DENTAL"
  | "LEGAL"
  | "SPA"
  | "EDUCATION";

export type RoiSegmentPreset = {
  key: RoiSegmentKey;
  label: string;
  eligibleLabel: string;
  unitLabel: string;
  traditionalTicket: number;
  unitPrice: number;
  platformFee: number;
  defaultEligible: number;
  defaultUtilizationPct: number;
};

export const ROI_SEGMENT_PRESETS: Record<RoiSegmentKey, RoiSegmentPreset> = {
  MEDICAL: {
    key: "MEDICAL",
    label: "Saúde",
    eligibleLabel: "colaboradores elegíveis",
    unitLabel: "consulta",
    traditionalTicket: 350,
    unitPrice: 272,
    platformFee: 3000,
    defaultEligible: 500,
    defaultUtilizationPct: 15,
  },
  VET: {
    key: "VET",
    label: "Veterinária",
    eligibleLabel: "tutores elegíveis",
    unitLabel: "atendimento",
    traditionalTicket: 80,
    unitPrice: 150,
    platformFee: 2000,
    defaultEligible: 300,
    defaultUtilizationPct: 20,
  },
  DENTAL: {
    key: "DENTAL",
    label: "Odontologia",
    eligibleLabel: "colaboradores elegíveis",
    unitLabel: "procedimento",
    traditionalTicket: 40,
    unitPrice: 200,
    platformFee: 2000,
    defaultEligible: 500,
    defaultUtilizationPct: 15,
  },
  LEGAL: {
    key: "LEGAL",
    label: "Jurídico",
    eligibleLabel: "contratos ativos",
    unitLabel: "hora técnica",
    traditionalTicket: 4000,
    unitPrice: 500,
    platformFee: 3000,
    defaultEligible: 10,
    defaultUtilizationPct: 30,
  },
  SPA: {
    key: "SPA",
    label: "Bem-estar",
    eligibleLabel: "colaboradores elegíveis",
    unitLabel: "sessão",
    traditionalTicket: 80,
    unitPrice: 120,
    platformFee: 2000,
    defaultEligible: 300,
    defaultUtilizationPct: 20,
  },
  EDUCATION: {
    key: "EDUCATION",
    label: "Educação",
    eligibleLabel: "colaboradores elegíveis",
    unitLabel: "aula",
    traditionalTicket: 50,
    unitPrice: 150,
    platformFee: 2000,
    defaultEligible: 200,
    defaultUtilizationPct: 15,
  },
};

export type RoiInputs = {
  eligible: number;
  utilizationPct: number;
  traditionalTicket: number;
  unitPrice: number;
  platformFee: number;
};

export type RoiResult = {
  unitsPerMonth: number;
  traditionalMonthly: number;
  variablePpu: number;
  ppuTotal: number;
  savingsMonthly: number;
  savingsPct: number;
  savingsAnnual: number;
};

export function computeRoi(inputs: RoiInputs): RoiResult {
  const eligible = Math.max(0, inputs.eligible);
  const utilizationPct = Math.min(100, Math.max(0, inputs.utilizationPct));
  const unitsPerMonth = Math.round(eligible * (utilizationPct / 100));
  const traditionalMonthly = eligible * inputs.traditionalTicket;
  const variablePpu = unitsPerMonth * inputs.unitPrice;
  const ppuTotal = variablePpu + inputs.platformFee;
  const savingsMonthly = Math.max(0, traditionalMonthly - ppuTotal);
  const savingsPct =
    traditionalMonthly > 0 ? (savingsMonthly / traditionalMonthly) * 100 : 0;

  return {
    unitsPerMonth,
    traditionalMonthly,
    variablePpu,
    ppuTotal,
    savingsMonthly,
    savingsPct,
    savingsAnnual: savingsMonthly * 12,
  };
}

export function formatBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPct(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export function parseRoiSegmentKey(value: string | null | undefined): RoiSegmentKey | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (normalized in ROI_SEGMENT_PRESETS) return normalized as RoiSegmentKey;
  const slugMap: Record<string, RoiSegmentKey> = {
    SAUDE: "MEDICAL",
    MEDICAL: "MEDICAL",
    VET: "VET",
    VETERINARIA: "VET",
    DENTAL: "DENTAL",
    ODONTO: "DENTAL",
    ODONTOLOGIA: "DENTAL",
    LEGAL: "LEGAL",
    JURIDICO: "LEGAL",
    SPA: "SPA",
    WELLNESS: "SPA",
    EDUCATION: "EDUCATION",
    EDUCACAO: "EDUCATION",
  };
  return slugMap[normalized] ?? null;
}
