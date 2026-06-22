import type { CompanyStatus } from "../../src/lib/company-crm";
import {
  FIRST_NAMES,
  LAST_NAMES,
  type SeedCompany,
} from "./companies";
import {
  beneficiaryEmail,
  birthDateForAge,
  formatCpf,
  phoneForIndex,
  pick,
  pjEmailFromCompany,
  seedCpf,
} from "./helpers";

export type GeneratedBeneficiary = {
  name: string;
  cpf: string;
  birthDate: Date;
  phone: string;
  email: string;
  companyIndex: number;
  /** Beneficiário principal da demo (João, Maria, Pedro) */
  isDemo?: "joao" | "maria" | "pedro";
};

const DEMO_BENEFICIARIES: Record<string, Partial<GeneratedBeneficiary>> = {
  joao: {
    name: "João Pereira",
    cpf: "111.222.333-44",
    birthDate: new Date("1985-04-12"),
    phone: "(11) 98888-1111",
    email: "joao.pereira@email.com",
    isDemo: "joao",
  },
  maria: {
    name: "Maria Souza",
    cpf: "555.666.777-88",
    birthDate: new Date("1992-09-30"),
    phone: "(11) 97777-2222",
    email: "maria.souza@email.com",
    isDemo: "maria",
  },
  pedro: {
    name: "Pedro Almeida",
    cpf: "999.000.111-22",
    birthDate: new Date("1978-01-05"),
    phone: "(11) 96666-3333",
    email: "pedro.almeida@email.com",
    isDemo: "pedro",
  },
};

/** Gera beneficiários para empresas com contrato (ATIVO / INADIMPLENTE). */
export function generateBeneficiaries(companies: SeedCompany[]): GeneratedBeneficiary[] {
  const result: GeneratedBeneficiary[] = [];
  let globalPatientIndex = 0;

  for (const company of companies) {
    if (company.beneficiaryCount <= 0) continue;

    for (let i = 0; i < company.beneficiaryCount; i++) {
      globalPatientIndex += 1;

      // Demo fixos na TechCorp (index 1)
      if (company.index === 1 && i === 0) {
        const demo = DEMO_BENEFICIARIES.joao!;
        result.push({
          name: demo.name!,
          cpf: demo.cpf!,
          birthDate: demo.birthDate!,
          phone: demo.phone!,
          email: demo.email!,
          companyIndex: company.index,
          isDemo: "joao",
        });
        continue;
      }
      if (company.index === 1 && i === 1) {
        const demo = DEMO_BENEFICIARIES.maria!;
        result.push({
          name: demo.name!,
          cpf: demo.cpf!,
          birthDate: demo.birthDate!,
          phone: demo.phone!,
          email: demo.email!,
          companyIndex: company.index,
          isDemo: "maria",
        });
        continue;
      }

      const first = pick(FIRST_NAMES, company.index + i);
      const last = pick(LAST_NAMES, company.index * 3 + i);
      const name = `${first} ${last}`;
      const age = 22 + ((company.index + i * 7) % 38);

      result.push({
        name,
        cpf: seedCpf(company.index, i + 1),
        birthDate: birthDateForAge(age, company.index + i),
        phone: phoneForIndex(globalPatientIndex),
        email: beneficiaryEmail(name, globalPatientIndex),
        companyIndex: company.index,
      });
    }
  }

  // Pedro — beneficiário particular (sem empresa)
  result.push({
    name: DEMO_BENEFICIARIES.pedro!.name!,
    cpf: DEMO_BENEFICIARIES.pedro!.cpf!,
    birthDate: DEMO_BENEFICIARIES.pedro!.birthDate!,
    phone: DEMO_BENEFICIARIES.pedro!.phone!,
    email: DEMO_BENEFICIARIES.pedro!.email!,
    companyIndex: 0,
    isDemo: "pedro",
  });

  return result;
}

export type PjUserSeed = {
  email: string;
  name: string;
  companyIndex: number;
};

/** Usuários PJ para empresas com contrato ativo ou inadimplente. */
export function generatePjUsers(companies: SeedCompany[]): PjUserSeed[] {
  const contractStatuses: CompanyStatus[] = ["ATIVO", "INADIMPLENTE"];

  return companies
    .filter((c) => contractStatuses.includes(c.status))
    .map((company) => ({
      email: company.pjEmail ?? pjEmailFromCompany(company.name, company.index),
      name: `RH ${company.name.split(" ")[0]}`,
      companyIndex: company.index,
    }));
}

/** Garante CPF único na lista (fallback se colisão). */
export function ensureUniqueCpfs(beneficiaries: GeneratedBeneficiary[]): GeneratedBeneficiary[] {
  const seen = new Set<string>();
  return beneficiaries.map((b, idx) => {
    let cpf = b.cpf.replace(/\D/g, "");
    if (seen.has(cpf)) {
      cpf = String(900_000_000 + idx).padStart(11, "0");
    }
    seen.add(cpf);
    return { ...b, cpf: formatCpf(cpf) };
  });
}
