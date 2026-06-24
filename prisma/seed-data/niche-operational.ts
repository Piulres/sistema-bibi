import type { PrismaClient } from "@prisma/client";
import type { ScaleConfig } from "./scale";
import type { SeedCompany } from "./companies";
import { contractActiveForStatus } from "./helpers";
import {
  beneficiaryEmail,
  birthDateForAge,
  phoneForIndex,
  seedCpf,
  pick,
} from "./helpers";
import {
  NICHE_OPERATIONAL_CONFIGS,
  nicheBenefitProduct,
  pickNicheAppointmentReason,
  pickNicheProcedureCode,
  isNicheTelemedicine,
  type NicheOperationalConfig,
} from "./niche-catalogs";
import {
  seedOperationalMass,
  seedBeneficiaryPortalUsers,
  type PatientRef,
  type ProcedureRef,
  type SeedMassStats,
} from "./scenarios";
import { seedPetClinicalDemo } from "./pet-clinical-demo";

export type NicheOperationalSummary = {
  niche: string;
  slug: string;
  companies: number;
  patients: number;
  providers: number;
  operational: SeedMassStats;
};

export type AllNicheOperationalResult = {
  summaries: NicheOperationalSummary[];
  totalAppointments: number;
  totalPatients: number;
};

const NICHE_FIRST = ["Ana", "Bruno", "Carla", "Diego", "Elena", "Fabio", "Gisele", "Hugo", "Ivan", "Julia"];
const NICHE_LAST = ["Alves", "Barros", "Cardoso", "Dias", "Esteves", "Freitas", "Gomes", "Henrique", "Ibrahim", "Junqueira"];

const NICHE_CPF_BASE: Record<string, number> = {
  VET: 10_000,
  DENTAL: 20_000,
  LEGAL: 30_000,
  SPA: 40_000,
  EDUCATION: 50_000,
};

async function seedSingleNicheOperational(
  prisma: PrismaClient,
  password: string,
  config: NicheOperationalConfig,
  scale: ScaleConfig,
): Promise<NicheOperationalSummary> {
  const tenant = await prisma.tenant.findFirstOrThrow({
    where: { slug: config.slug },
    select: { id: true, niche: true },
  });

  const interno = await prisma.user.findFirstOrThrow({
    where: { tenantId: tenant.id, role: "INTERNO" },
    select: { id: true },
  });

  const providers = await prisma.user.findMany({
    where: { tenantId: tenant.id, role: "PRESTADOR" },
    select: { id: true },
  });
  const providerIds = providers.map((p) => p.id);

  const procedureRows = await prisma.procedure.findMany({
    where: { tenantId: tenant.id },
  });
  const procedures: Record<string, ProcedureRef> = {};
  for (const p of procedureRows) {
    procedures[p.code] = {
      id: p.id,
      basePrice: p.basePrice,
      name: p.name,
      code: p.code,
      category: p.category,
    };
  }

  const companyIdByIndex = new Map<number, string>();
  const discountByCompanyIndex = new Map<number, number>();

  for (let i = 0; i < config.companies.length; i++) {
    const c = config.companies[i]!;
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
    if (c.clinicalDiscount) {
      discountByCompanyIndex.set(i + 1, c.clinicalDiscount);
    }
  }

  const activeCompany = config.companies.find((c) => c.status === "ATIVO");
  if (activeCompany) {
    const activeIdx = config.companies.indexOf(activeCompany) + 1;
    const companyId = companyIdByIndex.get(activeIdx);
    if (companyId) {
      const existingPj = await prisma.user.findUnique({
        where: { email: config.pjEmail },
      });
      if (!existingPj) {
        await prisma.user.create({
          data: {
            email: config.pjEmail,
            password,
            name: config.pjName,
            role: "PJ",
            tenantId: tenant.id,
            companyId,
          },
        });
      }
    }
  }

  const patientRefs: PatientRef[] = [];
  const starPatientIds = new Set<string>();
  const tutorEmailToPatientId = new Map<string, string>();
  let patientSeq = 0;

  for (const star of config.starPatients) {
    const companyId = companyIdByIndex.get(star.companyIndex) ?? null;
    const patient = await prisma.patient.create({
      data: {
        name: star.name,
        cpf: star.cpf,
        birthDate: star.birthDate,
        phone: star.phone,
        email: star.email,
        consentAt: new Date(),
        consentVersion: "v1-poc",
        tenantId: tenant.id,
        companyId,
        bondType: companyId ? "TITULAR" : undefined,
      },
    });

    const existingUser = await prisma.user.findUnique({ where: { email: star.email } });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: star.email,
          password,
          name: star.name,
          role: "BENEFICIARIO",
          tenantId: tenant.id,
          patientId: patient.id,
        },
      });
    }

    patientRefs.push({
      id: patient.id,
      name: star.name,
      companyId,
      companyIndex: star.companyIndex,
    });
    starPatientIds.add(patient.id);
    tutorEmailToPatientId.set(star.email, patient.id);
    patientSeq += 1;
  }

  const cpfBase = NICHE_CPF_BASE[config.niche] ?? 60_000;

  for (let ci = 0; ci < config.companies.length; ci++) {
    const c = config.companies[ci]!;
    if (c.beneficiaries <= 0) continue;
    const companyId = companyIdByIndex.get(ci + 1)!;
    const companyIndex = ci + 1;

    for (let b = 0; b < c.beneficiaries; b++) {
      patientSeq += 1;
      const name = `${pick(NICHE_FIRST, ci + b)} ${pick(NICHE_LAST, patientSeq)}`;
      const cpf = seedCpf(cpfBase + companyIndex * 100, cpfBase + patientSeq);

      const patient = await prisma.patient.create({
        data: {
          name,
          cpf,
          birthDate: birthDateForAge(25 + (b % 30), patientSeq),
          phone: phoneForIndex(patientSeq + companyIndex * 1000),
          email: beneficiaryEmail(name, patientSeq),
          consentAt: new Date(),
          consentVersion: "v1-poc",
          tenantId: tenant.id,
          companyId,
          bondType: b % 4 === 0 ? "DEPENDENTE" : "TITULAR",
        },
      });

      patientRefs.push({
        id: patient.id,
        name,
        companyId,
        companyIndex,
      });
    }
  }

  const petsByPatientId = new Map<string, string[]>();
  const starPetsForClinical: Array<{ id: string; name: string; patientId: string }> = [];

  if (config.niche === "VET") {
    for (const starPet of config.starPets ?? []) {
      const tutorId = tutorEmailToPatientId.get(starPet.tutorEmail);
      if (!tutorId) continue;
      const pet = await prisma.pet.create({
        data: {
          tenantId: tenant.id,
          patientId: tutorId,
          name: starPet.name,
          species: starPet.species,
          breed: starPet.breed,
          size: starPet.size,
          sex: starPet.sex ?? null,
          weightKg: starPet.weightKg ?? null,
          status: "ATIVO",
        },
      });
      starPetsForClinical.push({ id: pet.id, name: pet.name, patientId: tutorId });
      const list = petsByPatientId.get(tutorId) ?? [];
      list.push(pet.id);
      petsByPatientId.set(tutorId, list);
    }

    const bulkPetNames = ["Rex", "Nina", "Simba", "Pipoca", "Zeus", "Mia", "Max", "Buddy", "Lola", "Charlie"];
    const bulkBreeds = ["SRD", "Labrador", "Persa", "Shih Tzu", "Maine Coon", "Bulldog", "Husky", "Siamese"];
    const bulkSpecies = ["CANINO", "FELINO"] as const;
    const bulkSizes = ["PEQUENO", "MEDIO", "GRANDE"] as const;

    for (let pi = 0; pi < patientRefs.length; pi++) {
      const patient = patientRefs[pi]!;
      if ((petsByPatientId.get(patient.id)?.length ?? 0) > 0) continue;
      const petCount = 1 + (pi % 2);
      for (let k = 0; k < petCount; k++) {
        const pet = await prisma.pet.create({
          data: {
            tenantId: tenant.id,
            patientId: patient.id,
            name: `${pick(bulkPetNames, pi + k)} ${patient.name.split(" ")[0]}`,
            species: pick(bulkSpecies, pi + k),
            breed: pick(bulkBreeds, pi + k),
            size: pick(bulkSizes, pi + k),
            sex: (pi + k) % 2 === 0 ? "M" : "F",
            weightKg: 3 + ((pi + k) % 28),
            status: "ATIVO",
          },
        });
        const list = petsByPatientId.get(patient.id) ?? [];
        list.push(pet.id);
        petsByPatientId.set(patient.id, list);
      }
    }
  }

  const companiesForMass: SeedCompany[] = config.companies.map((c, idx) => ({
    index: idx + 1,
    name: c.name,
    cnpj: c.cnpj,
    status: c.status,
    sector: c.sector,
    useCase: `${config.slug} — ${c.sector}`,
    beneficiaryCount: c.beneficiaries,
    clinicalDiscount: c.clinicalDiscount,
  }));

  const nicheScale: ScaleConfig = {
    ...scale,
    appointmentCount: Math.max(35, Math.round(scale.appointmentCount * 0.45)),
    messageCount: Math.max(12, Math.round(scale.messageCount * 0.35)),
    beneficiaryPortalUsers: Math.min(6, scale.beneficiaryPortalUsers),
    historyDays: scale.historyDays,
  };

  const operational = await seedOperationalMass({
    prisma,
    tenantId: tenant.id,
    procedures,
    providerIds,
    internoId: interno.id,
    companyIdByIndex,
    discountByCompanyIndex,
    patients: patientRefs,
    excludePatientIds: starPatientIds,
    companies: companiesForMass,
    scale: nicheScale,
    pickProcedureCode: (companyIndex, companies, salt) =>
      pickNicheProcedureCode(config, companyIndex, companies, salt),
    pickAppointmentReason: (companyIndex, companies, salt) =>
      pickNicheAppointmentReason(config, companyIndex, companies, salt),
    isTelemedicineAppointment: (_companyIndex, _companies, salt) =>
      isNicheTelemedicine(config, salt),
    appointmentReasons: config.appointmentReasons,
    medicalRecordSnippets: config.recordSnippets,
    benefitProductPicker: (sector, salt) =>
      nicheBenefitProduct(config.niche, sector, salt),
    resolvePetId:
      config.niche === "VET"
        ? (patient, salt) => {
            const ids = petsByPatientId.get(patient.id);
            if (!ids?.length) return null;
            return ids[salt % ids.length] ?? null;
          }
        : undefined,
  });

  if (config.niche === "VET" && starPetsForClinical.length > 0) {
    await seedPetClinicalDemo(prisma, {
      tenantId: tenant.id,
      providerId: providerIds[0]!,
      pets: starPetsForClinical,
    });
  }

  const portalUsers = await seedBeneficiaryPortalUsers({
    prisma,
    tenantId: tenant.id,
    patients: patientRefs,
    excludePatientIds: starPatientIds,
    scale: nicheScale,
    password,
  });
  operational.beneficiaryUsers += portalUsers;

  return {
    niche: config.niche,
    slug: config.slug,
    companies: config.companies.length,
    patients: patientRefs.length,
    providers: providerIds.length,
    operational,
  };
}

/** Popula massa operacional completa para todos os tenants multi-nicho. */
export async function seedAllNicheOperational(
  prisma: PrismaClient,
  password: string,
  scale: ScaleConfig,
): Promise<AllNicheOperationalResult> {
  const summaries: NicheOperationalSummary[] = [];

  for (const config of NICHE_OPERATIONAL_CONFIGS) {
    console.log(`  Nicho ${config.niche} (${config.slug}) — empresas, tutores/clientes, agenda...`);
    const summary = await seedSingleNicheOperational(prisma, password, config, scale);
    summaries.push(summary);
    console.log(
      `    ${summary.companies} parceiros · ${summary.patients} cadastros · ${summary.operational.appointments} agendamentos · ${summary.operational.invoices} faturas`,
    );
  }

  return {
    summaries,
    totalAppointments: summaries.reduce((s, x) => s + x.operational.appointments, 0),
    totalPatients: summaries.reduce((s, x) => s + x.patients, 0),
  };
}

export function nicheDemoCredentials(): Array<{
  niche: string;
  slug: string;
  interno: string;
  prestador: string;
  beneficiario: string;
  pj: string;
}> {
  return NICHE_OPERATIONAL_CONFIGS.map((c) => ({
    niche: c.niche,
    slug: c.slug,
    interno: `operacao@${c.slug}.demo`,
    prestador: c.providers[0]?.email ?? "",
    beneficiario: c.starPatients[0]?.email ?? "",
    pj: c.pjEmail,
  }));
}
