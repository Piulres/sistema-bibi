import type { PrismaClient } from "@prisma/client";
import type { CompanyStatus } from "../../src/lib/company-crm";
import { contractActiveForStatus } from "./helpers";
import type { ScaleConfig } from "./scale";
import {
  seedOperationalMass,
  type PatientRef,
  type ProcedureRef,
} from "./scenarios";
import { ALL_SEED_PROCEDURES } from "./pricing-market";

type VitacareCompany = {
  name: string;
  cnpj: string;
  status: CompanyStatus;
  sector: string;
  beneficiaries: number;
};

const VITACARE_POOL: VitacareCompany[] = [
  { name: "VitaCorp Benefícios", cnpj: "77.111.222/0001-33", status: "ATIVO", sector: "Tecnologia", beneficiaries: 8 },
  { name: "BlueBank Saúde Corp", cnpj: "77.222.333/0001-44", status: "ATIVO", sector: "Financeiro", beneficiaries: 6 },
  { name: "RetailMax Varejo", cnpj: "77.333.444/0001-55", status: "ATIVO", sector: "Varejo", beneficiaries: 5 },
  { name: "Indústria Nova Era", cnpj: "77.444.555/0001-66", status: "ATIVO", sector: "Indústria", beneficiaries: 4 },
  { name: "Logística Express", cnpj: "77.555.666/0001-77", status: "NEGOCIACAO", sector: "Logística", beneficiaries: 0 },
  { name: "EduTech Ensino", cnpj: "77.666.777/0001-88", status: "PROPOSTA", sector: "Educação", beneficiaries: 0 },
  { name: "AgroVita Cooperativa", cnpj: "77.777.888/0001-99", status: "ATIVO", sector: "Agronegócio", beneficiaries: 5 },
  { name: "Startup Health Inno", cnpj: "77.888.999/0001-00", status: "LEAD", sector: "HealthTech", beneficiaries: 0 },
  { name: "Hotelaria Azul", cnpj: "77.999.000/0001-11", status: "ATIVO", sector: "Hospitalidade", beneficiaries: 4 },
  { name: "Construtora Horizonte", cnpj: "78.000.111/0001-22", status: "ATIVO", sector: "Construção", beneficiaries: 6 },
  { name: "Call Center Pro", cnpj: "78.111.222/0001-33", status: "INADIMPLENTE", sector: "BPO", beneficiaries: 3 },
  { name: "Franquia Fit Corp", cnpj: "78.222.333/0001-44", status: "ATIVO", sector: "Fitness", beneficiaries: 4 },
];

const VITACARE_FIRST = ["Ana", "Bruno", "Carla", "Diego", "Elena", "Fabio", "Gisele", "Hugo"];
const VITACARE_LAST = ["Moraes", "Nunes", "Oliveira", "Pires", "Queiroz", "Ramos", "Siqueira", "Teixeira"];

export type VitacareSeedResult = {
  tenantId: string;
  companies: number;
  patients: number;
  operational: Awaited<ReturnType<typeof seedOperationalMass>>;
};

/** Popula o tenant white-label VitaCare com ecossistema operacional reduzido. */
export async function seedVitacareTenant(
  prisma: PrismaClient,
  password: string,
  scale: ScaleConfig,
): Promise<VitacareSeedResult> {
  const tenant = await prisma.tenant.create({
    data: {
      name: "Rede VitaCare",
      slug: "vitacare",
      cnpj: "99.888.777/0001-11",
      niche: "MEDICAL",
      branding: {
        create: {
          displayName: "VitaCare",
          tagline: "Saúde corporativa sob medida",
          primaryColor: "#2563eb",
          accentColor: "#3b82f6",
          heroFrom: "#1e3a8a",
          heroTo: "#1d4ed8",
          platformLabel: "Powered by Sistema Bibi - ServiceOS",
          colorScheme: "dark",
        },
      },
    },
  });

  const companies = VITACARE_POOL.slice(0, scale.vitacareCompanies);
  const companyIdByIndex = new Map<number, string>();

  for (let i = 0; i < companies.length; i++) {
    const c = companies[i]!;
    const created = await prisma.company.create({
      data: {
        name: c.name,
        cnpj: c.cnpj,
        status: c.status,
        contractActive: contractActiveForStatus(c.status),
        tenantId: tenant.id,
      },
    });
    companyIdByIndex.set(i + 1, created.id);
  }

  const prestador = await prisma.user.create({
    data: {
      email: "dr.silva@vitacare.demo",
      password,
      name: "Dr. André Silva",
      role: "PRESTADOR",
      tenantId: tenant.id,
    },
  });

  const interno = await prisma.user.create({
    data: {
      email: "operacao@vitacare.demo",
      password,
      name: "Operação VitaCare",
      role: "INTERNO",
      internoProfile: "ADMIN",
      tenantId: tenant.id,
    },
  });

  const activeIdx = companies.findIndex((c) => c.status === "ATIVO");
  if (activeIdx >= 0) {
    const companyId = companyIdByIndex.get(activeIdx + 1);
    if (companyId) {
      await prisma.user.create({
        data: {
          email: "rh@vitacarecorp.demo",
          password,
          name: "RH VitaCorp",
          role: "PJ",
          tenantId: tenant.id,
          companyId,
        },
      });
    }
  }

  const procData = ALL_SEED_PROCEDURES.filter((p) =>
    ["CON-CLM", "CON-CAR", "EXA-HEM", "CON-PSI", "OCC-PCM"].includes(p.code),
  );

  const procedures: Record<string, ProcedureRef> = {};
  for (const p of procData) {
    const created = await prisma.procedure.create({
      data: { ...p, tenantId: tenant.id },
    });
    procedures[p.code] = {
      id: created.id,
      basePrice: created.basePrice,
      name: created.name,
      code: p.code,
      category: p.category,
    };
  }

  const patientRefs: PatientRef[] = [];
  let patientSeq = 0;

  for (let ci = 0; ci < companies.length; ci++) {
    const c = companies[ci]!;
    if (c.beneficiaries <= 0) continue;
    const companyId = companyIdByIndex.get(ci + 1)!;
    const count = Math.max(c.beneficiaries, scale.vitacareBeneficiariesPerCompany);

    for (let b = 0; b < count; b++) {
      patientSeq += 1;
      const name = `${VITACARE_FIRST[b % VITACARE_FIRST.length]} ${VITACARE_LAST[(ci + b) % VITACARE_LAST.length]}`;
      const cpf = `${String(700_000_000 + patientSeq).slice(0, 3)}.${String(patientSeq).padStart(3, "0")}.${String(patientSeq * 7).padStart(3, "0")}-${String(patientSeq % 100).padStart(2, "0")}`;

      const patient = await prisma.patient.create({
        data: {
          name,
          cpf,
          birthDate: new Date(1980 + (b % 25), b % 12, 1 + (b % 27)),
          phone: `(21) 9${String(8000_0000 + patientSeq).slice(-8)}`,
          consentAt: new Date(),
          consentVersion: "v1-poc",
          tenantId: tenant.id,
          companyId,
        },
      });

      patientRefs.push({
        id: patient.id,
        name,
        companyId,
        companyIndex: ci + 1,
      });
    }
  }

  const vitacareCompaniesForMass = companies.map((c, idx) => ({
    index: idx + 1,
    name: c.name,
    cnpj: c.cnpj,
    status: c.status,
    sector: c.sector,
    useCase: `VitaCare — ${c.sector}`,
    beneficiaryCount: c.beneficiaries,
  }));

  const operational = await seedOperationalMass({
    prisma,
    tenantId: tenant.id,
    procedures,
    providerIds: [prestador.id],
    internoId: interno.id,
    companyIdByIndex,
    discountByCompanyIndex: new Map([[1, 0.88]]),
    patients: patientRefs,
    excludePatientIds: new Set(),
    companies: vitacareCompaniesForMass,
    scale: {
      ...scale,
      appointmentCount: Math.round(scale.appointmentCount * 0.35),
      messageCount: Math.round(scale.messageCount * 0.3),
      beneficiaryPortalUsers: Math.min(4, scale.beneficiaryPortalUsers),
    },
  });

  return {
    tenantId: tenant.id,
    companies: companies.length,
    patients: patientRefs.length,
    operational,
  };
}
