/** Perfil comercial da massa — complementa SEED_SCALE (volume). */
export type SeedProfile = "market" | "operation-1y";

export type SeedProfileConfig = {
  profile: SeedProfile;
  /** Empresas PJ no tenant Horizonte */
  companyCount: number;
  /** Usuários portal PJ por empresa com contrato (ATIVO / INADIMPLENTE) */
  pjUsersPerCompany: { min: number; max: number };
  /** Descrição para logs e documentação */
  description: string;
};

const PRESETS: Record<SeedProfile, SeedProfileConfig> = {
  market: {
    profile: "market",
    companyCount: 50,
    pjUsersPerCompany: { min: 1, max: 1 },
    description: "Pipeline comercial amplo (50 PJ) — demos de vendas e CRM",
  },
  "operation-1y": {
    profile: "operation-1y",
    companyCount: 20,
    pjUsersPerCompany: { min: 3, max: 9 },
    description: "Operação realista — 20 clientes B2B, 1 ano de histórico, equipe PJ 3–9",
  },
};

export function resolveSeedProfile(): SeedProfileConfig {
  const raw = (process.env.SEED_PROFILE ?? "market").toLowerCase();
  if (raw === "operation-1y" || raw === "operation_1y" || raw === "operation1y") {
    return PRESETS["operation-1y"];
  }
  if (raw !== "market") {
    console.warn(`SEED_PROFILE="${raw}" invalido — usando market`);
  }
  return PRESETS.market;
}
