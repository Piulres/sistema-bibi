import { describe, expect, it } from "vitest";
import { NICHE_IDS } from "@/lib/niche/types";
import { NICHE_MASTER_LABELS, NICHE_LABEL_KEYS } from "@/constants/niches";
import { OPERATION_COMPANIES } from "../../prisma/seed-data/companies-operation";
import { resolveSeedCompanies } from "../../prisma/seed-data/resolve-companies";
import { resolveSeedProfile } from "../../prisma/seed-data/profile";
import { generatePjUsers } from "../../prisma/seed-data/generators";

describe("Seed — perfil operation-1y", () => {
  it("operation-1y seleciona 20 clientes B2B com mix CRM realista", () => {
    const prev = process.env.SEED_PROFILE;
    process.env.SEED_PROFILE = "operation-1y";
    try {
      const companies = resolveSeedCompanies();
      expect(companies).toHaveLength(20);
      expect(companies[0]?.name).toContain("TechCorp");
      const ativos = companies.filter((c) => c.status === "ATIVO").length;
      const inadimplentes = companies.filter((c) => c.status === "INADIMPLENTE").length;
      expect(ativos).toBe(14);
      expect(inadimplentes).toBe(2);
    } finally {
      process.env.SEED_PROFILE = prev;
    }
  });

  it("operation-1y gera 3–9 usuários PJ por cliente com contrato", () => {
    const prev = process.env.SEED_PROFILE;
    process.env.SEED_PROFILE = "operation-1y";
    try {
      const profile = resolveSeedProfile();
      const pjUsers = generatePjUsers(OPERATION_COMPANIES, profile);
    const contractCompanies = OPERATION_COMPANIES.filter(
      (c) => c.status === "ATIVO" || c.status === "INADIMPLENTE",
    );

    expect(contractCompanies.length).toBe(16);
    expect(pjUsers.length).toBeGreaterThanOrEqual(contractCompanies.length * 3);
    expect(pjUsers.length).toBeLessThanOrEqual(contractCompanies.length * 9);

    for (const company of contractCompanies) {
      const team = pjUsers.filter((u) => u.companyIndex === company.index);
      expect(team.length).toBeGreaterThanOrEqual(3);
      expect(team.length).toBeLessThanOrEqual(9);
      expect(team[0]?.email).toBeTruthy();
    }
    } finally {
      process.env.SEED_PROFILE = prev;
    }
  });
});

describe("Seed — glossário comum a todos os segmentos", () => {
  it("cada nicho define todas as chaves obrigatórias de labels", () => {
    for (const niche of NICHE_IDS) {
      const labels = NICHE_MASTER_LABELS[niche];
      for (const key of NICHE_LABEL_KEYS) {
        expect(labels[key], `${niche}.${key}`).toBeTruthy();
      }
    }
  });

  it("todos os nichos compartilham estrutura de portais (4 roles)", () => {
    const portalKeys = ["portalBeneficiary", "portalProvider"] as const;
    for (const niche of NICHE_IDS) {
      const labels = NICHE_MASTER_LABELS[niche];
      for (const key of portalKeys) {
        expect(labels[key]).toMatch(/Portal/);
      }
    }
  });
});
