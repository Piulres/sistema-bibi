import { describe, expect, it } from "vitest";
import { isValidCpf } from "@/lib/validation/br-documents";
import { buildValidCpfFromBase, demoCpf, seedCpf } from "../../prisma/seed-data/helpers";
import { ensureUniqueCpfs, generateBeneficiaries } from "../../prisma/seed-data/generators";
import { SEED_COMPANIES } from "../../prisma/seed-data/companies";

describe("seed CPF helpers", () => {
  it("gera CPF válido a partir de base determinística", () => {
    expect(isValidCpf(buildValidCpfFromBase("123456789"))).toBe(true);
    expect(isValidCpf(seedCpf(12, 34))).toBe(true);
    expect(isValidCpf(demoCpf(42))).toBe(true);
  });

  it("massa gerada tem CPFs válidos e únicos", () => {
    const beneficiaries = ensureUniqueCpfs(generateBeneficiaries(SEED_COMPANIES.slice(0, 5)));
    const cpfs = beneficiaries.map((b) => b.cpf.replace(/\D/g, ""));
    expect(cpfs.every((cpf) => isValidCpf(cpf))).toBe(true);
    expect(new Set(cpfs).size).toBe(cpfs.length);
  });
});
