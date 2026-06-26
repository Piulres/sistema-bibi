import type { SeedCompany } from "./companies";
import { SEED_COMPANIES } from "./companies";

/**
 * Subconjunto de 20 clientes B2B para simular 1 ano de operação realista.
 * Mantém índices originais (CPF/CNPJ determinísticos) e TechCorp como âncora demo.
 *
 * Mix CRM: 14 ATIVO · 2 INADIMPLENTE · 2 NEGOCIAÇÃO · 1 PROPOSTA · 1 LEAD
 */
const OPERATION_COMPANY_INDICES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  25, 26,
  28, 29,
  35,
  42,
] as const;

export const OPERATION_COMPANIES: SeedCompany[] = OPERATION_COMPANY_INDICES.map((index) => {
  const company = SEED_COMPANIES.find((c) => c.index === index);
  if (!company) {
    throw new Error(`Seed operation: empresa índice ${index} não encontrada em SEED_COMPANIES`);
  }
  return company;
});

export const OPERATION_COMPANY_COUNT = OPERATION_COMPANIES.length;
