/**
 * Tabelas de preço CEDIG Cruzeiro — Particular, CentralMed e convênios.
 * Fonte: tabelas institucionais fornecidas pelo cliente (2026).
 */

export const CEDIG_PRICE_TABLES = [
  { id: "PARTICULAR", label: "Particular" },
  { id: "CENTRALMED", label: "CentralMed (institucional)" },
  { id: "BEM_SAUDE", label: "Bem Saúde" },
  { id: "DR_SAUDE", label: "Dr Saúde" },
] as const;

export type CedigPriceTableId = (typeof CEDIG_PRICE_TABLES)[number]["id"];

export const CEDIG_POLYPECTOMY_TIERS = [
  {
    id: "SIMPLES",
    label: "Simples — até 5 mm (1 alça)",
  },
  {
    id: "INTERMEDIARIA",
    label: "Intermediária — 5 a 10 mm (1 alça)",
  },
  {
    id: "AVANCADA",
    label: "Avançada — 10 a 15 mm (agulha + alça)",
  },
  {
    id: "COMPLEXA",
    label: "Complexa — 15 a 20 mm (agulha + alça)",
  },
] as const;

export type CedigPolypectomyTierId =
  (typeof CEDIG_POLYPECTOMY_TIERS)[number]["id"];

/** Exames diagnósticos e terapêuticos (código = Procedure.code). */
const EXAM_PRICES: Record<
  string,
  Partial<Record<CedigPriceTableId, number>> & { PARTICULAR: number }
> = {
  "CEDIG-ENDO": { PARTICULAR: 750, CENTRALMED: 650 },
  "CEDIG-COLO": { PARTICULAR: 1450, CENTRALMED: 1250 },
  "CEDIG-ENDO-COLO": { PARTICULAR: 2000, CENTRALMED: 1900 },
  "CEDIG-MUCO": { PARTICULAR: 3200, CENTRALMED: 3100 },
  "CEDIG-RESP": {
    PARTICULAR: 500,
    CENTRALMED: 400,
    BEM_SAUDE: 450,
    DR_SAUDE: 450,
  },
};

const BIOPSY_PER_VIAL = 150;

const POLYPECTOMY_PRICES: Record<
  CedigPolypectomyTierId,
  { PARTICULAR: number; CENTRALMED: number }
> = {
  SIMPLES: { PARTICULAR: 550, CENTRALMED: 550 },
  INTERMEDIARIA: { PARTICULAR: 850, CENTRALMED: 800 },
  AVANCADA: { PARTICULAR: 1200, CENTRALMED: 1150 },
  COMPLEXA: { PARTICULAR: 1600, CENTRALMED: 1400 },
};

const CLIP_PRICES = { PARTICULAR: 900, CENTRALMED: 800 } as const;

/** Para Bem Saúde / Dr Saúde sem tabela completa: usa Particular nos demais itens. */
function resolveTable(
  table: CedigPriceTableId,
): "PARTICULAR" | "CENTRALMED" {
  if (table === "CENTRALMED") return "CENTRALMED";
  return "PARTICULAR";
}

export function cedigPriceTableLabel(id: string): string {
  return CEDIG_PRICE_TABLES.find((t) => t.id === id)?.label ?? id;
}

export function cedigPolypectomyTierLabel(id: string | null | undefined): string {
  if (!id) return "—";
  return CEDIG_POLYPECTOMY_TIERS.find((t) => t.id === id)?.label ?? id;
}

export function getCedigExamBasePrice(
  procedureCode: string,
  table: CedigPriceTableId,
): number | null {
  const row = EXAM_PRICES[procedureCode];
  if (!row) return null;
  if (row[table] != null) return row[table]!;
  return row[resolveTable(table)] ?? row.PARTICULAR;
}

export type CedigAmountSuggestionInput = {
  procedureCode: string;
  priceTable: CedigPriceTableId;
  biopsies?: number;
  polypectomies?: number;
  polypectomyTier?: CedigPolypectomyTierId | "" | null;
  mucosectomies?: number;
  clips?: number;
};

export type CedigAmountSuggestion = {
  total: number;
  breakdown: { label: string; amount: number }[];
};

export function suggestCedigAmount(
  input: CedigAmountSuggestionInput,
): CedigAmountSuggestion | null {
  const table = CEDIG_PRICE_TABLES.some((t) => t.id === input.priceTable)
    ? input.priceTable
    : ("PARTICULAR" as CedigPriceTableId);

  const base = getCedigExamBasePrice(input.procedureCode, table);
  if (base == null) return null;

  const billingTable = resolveTable(table);
  const breakdown: { label: string; amount: number }[] = [];
  breakdown.push({ label: "Exame base", amount: base });

  const biopsies = Math.max(0, Math.floor(Number(input.biopsies ?? 0)));
  if (biopsies > 0) {
    breakdown.push({
      label: `Biópsias (${biopsies} frasco${biopsies > 1 ? "s" : ""})`,
      amount: biopsies * BIOPSY_PER_VIAL,
    });
  }

  const polyCount = Math.max(0, Math.floor(Number(input.polypectomies ?? 0)));
  const tier = input.polypectomyTier;
  if (
    polyCount > 0 &&
    tier &&
    CEDIG_POLYPECTOMY_TIERS.some((t) => t.id === tier)
  ) {
    const unit = POLYPECTOMY_PRICES[tier as CedigPolypectomyTierId][billingTable];
    breakdown.push({
      label: `Polipectomia ${tier.toLowerCase()} × ${polyCount}`,
      amount: unit * polyCount,
    });
  }

  // Mucosectomia só soma se o exame base NÃO for já a mucosectomia terapêutica
  const mucoCount = Math.max(0, Math.floor(Number(input.mucosectomies ?? 0)));
  if (mucoCount > 0 && input.procedureCode !== "CEDIG-MUCO") {
    const mucoUnit =
      EXAM_PRICES["CEDIG-MUCO"][billingTable] ?? EXAM_PRICES["CEDIG-MUCO"].PARTICULAR;
    breakdown.push({
      label: `Mucosectomia × ${mucoCount}`,
      amount: mucoUnit * mucoCount,
    });
  }

  const clips = Math.max(0, Math.floor(Number(input.clips ?? 0)));
  if (clips > 0) {
    breakdown.push({
      label: `Clip hemostático × ${clips}`,
      amount: CLIP_PRICES[billingTable] * clips,
    });
  }

  const total = breakdown.reduce((s, b) => s + b.amount, 0);
  return { total, breakdown };
}

export function isCedigPriceTableId(v: string): v is CedigPriceTableId {
  return CEDIG_PRICE_TABLES.some((t) => t.id === v);
}

export function isCedigPolypectomyTierId(
  v: string,
): v is CedigPolypectomyTierId {
  return CEDIG_POLYPECTOMY_TIERS.some((t) => t.id === v);
}
