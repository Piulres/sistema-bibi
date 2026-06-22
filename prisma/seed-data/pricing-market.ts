import type { SeedCompany } from "./companies";

/** Catálogo base — referência mercado privado/corporativo BR (2024–2025, clínica média). */
export const BASE_PROCEDURES = [
  { code: "CON-CLM", name: "Consulta Clínica Médica", category: "CONSULTA", basePrice: 320, tissCode: "10101012" },
  { code: "CON-CAR", name: "Consulta Cardiologia", category: "CONSULTA", basePrice: 420, tissCode: "10101039" },
  { code: "CON-DER", name: "Consulta Dermatologia", category: "CONSULTA", basePrice: 380, tissCode: "10101047" },
  { code: "CON-PSI", name: "Consulta Psicologia", category: "CONSULTA", basePrice: 280, tissCode: "10101063" },
  { code: "CON-OFT", name: "Consulta Oftalmologia", category: "CONSULTA", basePrice: 350, tissCode: "10101055" },
  { code: "EXA-HEM", name: "Hemograma Completo", category: "EXAME", basePrice: 48, tissCode: "40304361" },
  { code: "EXA-ECG", name: "Eletrocardiograma", category: "EXAME", basePrice: 95, tissCode: "40101010" },
  { code: "EXA-USG", name: "Ultrassonografia Abdominal", category: "EXAME", basePrice: 220, tissCode: "40901106" },
  { code: "EXA-RX", name: "Raio-X Tórax", category: "EXAME", basePrice: 78, tissCode: "40801063" },
  { code: "EXA-GLI", name: "Glicemia em Jejum", category: "EXAME", basePrice: 22, tissCode: "40301605" },
  { code: "EXA-COL", name: "Colesterol Total", category: "EXAME", basePrice: 28, tissCode: "40301621" },
] as const;

/** Medicina do trabalho — pacotes típicos ASO/PCMSO (B2B). */
export const OCCUPATIONAL_PROCEDURES = [
  { code: "OCC-ASO", name: "ASO — Exame Admissional", category: "OCUPACIONAL", basePrice: 110, tissCode: "40316049" },
  { code: "OCC-PCM", name: "Exame Periódico PCMSO", category: "OCUPACIONAL", basePrice: 85, tissCode: "40316057" },
  { code: "OCC-AUD", name: "Audiometria Ocupacional", category: "OCUPACIONAL", basePrice: 65, tissCode: "40103047" },
] as const;

export const ALL_SEED_PROCEDURES = [...BASE_PROCEDURES, ...OCCUPATIONAL_PROCEDURES] as const;

export type ProcedureCode = (typeof ALL_SEED_PROCEDURES)[number]["code"];

/** Benefícios corporativos (add-on), não plano de saúde operadora. */
export const CORPORATE_BENEFIT_PRODUCTS = {
  TELEMEDICINA_24H: {
    billingCycle: "MENSAL" as const,
    amount: 29.9,
    description: "Telemedicina 24h — consultas ilimitadas por vídeo",
  },
  BEM_ESTAR_MENTAL: {
    billingCycle: "MENSAL" as const,
    amount: 39.9,
    description: "Bem-estar mental — psicologia por app e teleconsulta",
  },
  CHECKUP_PROGRAMADO: {
    billingCycle: "TRIMESTRAL" as const,
    amount: 119.7,
    description: "Check-up programado — painel laboratorial trimestral",
  },
  TELEMEDICINA_PARTICULAR: {
    billingCycle: "MENSAL" as const,
    amount: 49.9,
    description: "Telemedicina particular — acesso individual",
  },
} as const;

export type SectorClinicalProfile = {
  procedureCodes: ProcedureCode[];
  telemedicineRatio: number;
  reasons: readonly string[];
};

const SECTOR_PROFILES: Record<string, SectorClinicalProfile> = {
  Tecnologia: {
    procedureCodes: ["CON-CLM", "CON-PSI", "EXA-HEM", "EXA-GLI", "EXA-COL"],
    telemedicineRatio: 0.65,
    reasons: ["Teleconsulta", "Check-up anual", "Saúde mental — acompanhamento", "Retorno", "Dor de cabeça"],
  },
  Financeiro: {
    procedureCodes: ["CON-CLM", "CON-CAR", "EXA-ECG", "EXA-HEM", "EXA-GLI", "EXA-COL"],
    telemedicineRatio: 0.35,
    reasons: ["Check-up executivo", "Avaliação cardiológica", "Check-up anual", "Retorno"],
  },
  Varejo: {
    procedureCodes: ["CON-CLM", "EXA-HEM", "EXA-RX", "OCC-PCM"],
    telemedicineRatio: 0.2,
    reasons: ["Consulta de rotina", "Atestado de saúde", "ASO periódico", "Retorno"],
  },
  Indústria: {
    procedureCodes: ["OCC-ASO", "OCC-PCM", "OCC-AUD", "EXA-ECG", "EXA-RX", "CON-CLM"],
    telemedicineRatio: 0.1,
    reasons: ["Exame admissional", "ASO periódico", "PCMSO — exame complementar", "Avaliação pré-operatória"],
  },
  Logística: {
    procedureCodes: ["OCC-ASO", "OCC-PCM", "EXA-ECG", "CON-CAR", "CON-CLM"],
    telemedicineRatio: 0.15,
    reasons: ["ASO periódico", "Avaliação cardiológica", "Exame admissional", "Retorno pós-exame"],
  },
  "Construção Civil": {
    procedureCodes: ["OCC-ASO", "OCC-PCM", "EXA-RX", "CON-CLM", "CON-DER"],
    telemedicineRatio: 0.1,
    reasons: ["Exame admissional", "PCMSO — exame complementar", "Dermatite ocupacional", "ASO periódico"],
  },
  Agronegócio: {
    procedureCodes: ["CON-CLM", "EXA-HEM", "EXA-USG", "OCC-PCM"],
    telemedicineRatio: 0.55,
    reasons: ["Teleconsulta", "Check-up anual", "Retorno", "Consulta de rotina"],
  },
  Educação: {
    procedureCodes: ["CON-CLM", "CON-PSI", "EXA-HEM", "CON-OFT"],
    telemedicineRatio: 0.4,
    reasons: ["Consulta de rotina", "Saúde mental — acompanhamento", "Check-up anual", "Retorno"],
  },
  Saúde: {
    procedureCodes: ["CON-CLM", "CON-OFT", "EXA-HEM", "EXA-ECG"],
    telemedicineRatio: 0.25,
    reasons: ["Consulta de rotina", "Check-up anual", "Retorno", "Avaliação cardiológica"],
  },
};

const DEFAULT_PROFILE: SectorClinicalProfile = {
  procedureCodes: ["CON-CLM", "EXA-HEM", "EXA-ECG"],
  telemedicineRatio: 0.25,
  reasons: ["Consulta de rotina", "Retorno", "Check-up anual"],
};

export function sectorProfile(sector: string): SectorClinicalProfile {
  return SECTOR_PROFILES[sector] ?? DEFAULT_PROFILE;
}

export function companyByIndex(companies: SeedCompany[], index: number): SeedCompany | undefined {
  return companies.find((c) => c.index === index);
}

export function pickProcedureCode(
  companyIndex: number,
  companies: SeedCompany[],
  salt: number,
): ProcedureCode {
  const company = companyByIndex(companies, companyIndex);
  const profile = sectorProfile(company?.sector ?? "");
  return profile.procedureCodes[salt % profile.procedureCodes.length]!;
}

export function pickAppointmentReason(
  companyIndex: number,
  companies: SeedCompany[],
  salt: number,
): string {
  const company = companyByIndex(companies, companyIndex);
  const profile = sectorProfile(company?.sector ?? "");
  return profile.reasons[salt % profile.reasons.length]!;
}

export function isTelemedicineAppointment(
  companyIndex: number,
  companies: SeedCompany[],
  salt: number,
): boolean {
  const company = companyByIndex(companies, companyIndex);
  const profile = sectorProfile(company?.sector ?? "");
  return salt % 100 < profile.telemedicineRatio * 100;
}

const DISCOUNTABLE_CATEGORIES = new Set(["CONSULTA", "OCUPACIONAL"]);

export function chargePrice(
  category: string,
  basePrice: number,
  companyIndex: number,
  discounts: Map<number, number>,
): number {
  if (companyIndex > 0 && DISCOUNTABLE_CATEGORIES.has(category)) {
    const m = discounts.get(companyIndex);
    if (m) return Math.round(basePrice * m * 100) / 100;
  }
  return basePrice;
}

/** Produto de benefício corporativo por setor. */
export function benefitProductForSector(sector: string, salt: number) {
  if (sector === "Tecnologia" || sector === "HealthTech") {
    return salt % 3 === 0
      ? CORPORATE_BENEFIT_PRODUCTS.BEM_ESTAR_MENTAL
      : CORPORATE_BENEFIT_PRODUCTS.TELEMEDICINA_24H;
  }
  if (sector === "Financeiro" || sector === "Educação") {
    return salt % 2 === 0
      ? CORPORATE_BENEFIT_PRODUCTS.CHECKUP_PROGRAMADO
      : CORPORATE_BENEFIT_PRODUCTS.TELEMEDICINA_24H;
  }
  if (sector === "Indústria" || sector === "Construção Civil" || sector === "Logística") {
    return CORPORATE_BENEFIT_PRODUCTS.TELEMEDICINA_24H;
  }
  return CORPORATE_BENEFIT_PRODUCTS.TELEMEDICINA_24H;
}

/** Estimativa mensal de faturamento PPU corporativo (R$) por empresa ativa. */
export function estimateCompanyMonthlyPpu(company: SeedCompany): number {
  const profile = sectorProfile(company.sector);
  const avgProc =
    profile.procedureCodes.reduce((sum, code) => {
      const proc = ALL_SEED_PROCEDURES.find((p) => p.code === code);
      const base = proc?.basePrice ?? 120;
      const discounted =
        company.clinicalDiscount && proc && DISCOUNTABLE_CATEGORIES.has(proc.category)
          ? base * company.clinicalDiscount
          : base;
      return sum + discounted;
    }, 0) / profile.procedureCodes.length;

  const usagesPerMonth = company.sector === "Indústria" || company.sector === "Construção Civil"
    ? company.beneficiaryCount * 0.35
    : company.beneficiaryCount * 0.22;

  return Math.round(usagesPerMonth * avgProc * 100) / 100;
}

export function formatBrl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
