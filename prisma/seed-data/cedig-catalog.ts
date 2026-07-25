/**
 * Catálogo operacional CEDIG Cruzeiro — endoscopia / colonoscopia.
 * Preços base (Procedure.basePrice) = tabela Particular.
 * Tabelas CentralMed / Bem Saúde / Dr Saúde: `src/lib/clinic-finance/cedig-pricing.ts`.
 */
import type { PrismaClient } from "@prisma/client";
import { serializeTenantLabels } from "../../src/constants/niches";
import { hashPassword } from "../../src/lib/password";

const DEMO_PASSWORD = hashPassword("bibi123");

export const CEDIG_PROCEDURES = [
  {
    code: "CEDIG-ENDO",
    name: "Endoscopia Digestiva Alta",
    category: "EXAME",
    serviceType: "ENDOSCOPIA",
    basePrice: 750,
    tissCode: null as string | null,
  },
  {
    code: "CEDIG-COLO",
    name: "Colonoscopia",
    category: "EXAME",
    serviceType: "ENDOSCOPIA",
    basePrice: 1450,
    tissCode: null,
  },
  {
    code: "CEDIG-ENDO-COLO",
    name: "Endoscopia + Colonoscopia",
    category: "EXAME",
    serviceType: "ENDOSCOPIA",
    basePrice: 2000,
    tissCode: null,
  },
  {
    code: "CEDIG-MUCO",
    name: "Colonoscopia terapêutica com mucosectomia",
    category: "EXAME",
    serviceType: "ENDOSCOPIA",
    basePrice: 3200,
    tissCode: null,
  },
  {
    code: "CEDIG-RESP",
    name: "Teste respiratório",
    category: "EXAME",
    serviceType: "DIAGNOSTICO",
    basePrice: 500,
    tissCode: null,
  },
] as const;

/** Labels UI mais próximas da operação de exames do CEDIG. */
export const CEDIG_LABEL_OVERRIDES = {
  appointment: "Exame",
  appointments: "Exames",
  procedure: "Exame",
  procedures: "Exames",
  service: "Exame endoscópico",
} as const;

/** Equipe operacional CEDIG (seed demo). */
export const CEDIG_STAFF = [
  {
    email: "operacao@cedig.demo",
    name: "Operação CEDIG",
    role: "INTERNO",
    internoProfile: "ADMIN",
    specialty: null as string | null,
  },
  {
    email: "alana@cedig.demo",
    name: "Alana",
    role: "INTERNO",
    internoProfile: "RECEPCAO",
    specialty: "Secretária",
  },
  {
    email: "recepcao@cedig.demo",
    name: "Alana (Recepção CEDIG)",
    role: "INTERNO",
    internoProfile: "RECEPCAO",
    specialty: "Secretária",
  },
  {
    email: "joao.marcos@cedig.demo",
    name: "João Marcos",
    role: "INTERNO",
    internoProfile: "RECEPCAO",
    specialty: "Enfermeiro",
  },
  {
    email: "marcia@cedig.demo",
    name: "Márcia",
    role: "INTERNO",
    internoProfile: "RECEPCAO",
    specialty: "Técnica de enfermagem",
  },
  {
    email: "alexandre.marcal@cedig.demo",
    name: "Dr. Alexandre Marçal",
    role: "PRESTADOR",
    internoProfile: null,
    specialty: "Endoscopia digestiva",
  },
  {
    email: "luiza.lage@cedig.demo",
    name: "Dra. Luiza Lage",
    role: "PRESTADOR",
    internoProfile: null,
    specialty: "Endoscopia digestiva",
  },
  {
    email: "bruno.dias@cedig.demo",
    name: "Dr. Bruno Dias",
    role: "PRESTADOR",
    internoProfile: null,
    specialty: "Endoscopia digestiva",
  },
  {
    email: "luiza.zeraik@cedig.demo",
    name: "Dra. Luiza Zeraik",
    role: "PRESTADOR",
    internoProfile: null,
    specialty: "Endoscopia digestiva",
  },
  {
    email: "fernanda.auto@cedig.demo",
    name: "Dra. Fernanda Auto",
    role: "PRESTADOR",
    internoProfile: null,
    specialty: "Endoscopia digestiva",
  },
] as const;

/** E-mails do primeiro seed — deixam de ser PRESTADOR para não duplicar o select. */
const CEDIG_LEGACY_PROVIDER_ALIASES = ["bruno@cedig.demo", "luiza@cedig.demo"] as const;

export async function upsertCedigProcedures(
  prisma: PrismaClient,
  tenantId: string,
): Promise<number> {
  let count = 0;
  for (const p of CEDIG_PROCEDURES) {
    await prisma.procedure.upsert({
      where: { tenantId_code: { tenantId, code: p.code } },
      create: { tenantId, ...p },
      update: {
        name: p.name,
        category: p.category,
        serviceType: p.serviceType,
        basePrice: p.basePrice,
      },
    });
    count += 1;
  }
  return count;
}

async function upsertCedigStaff(prisma: PrismaClient, tenantId: string) {
  for (const u of CEDIG_STAFF) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (exists) {
      await prisma.user.update({
        where: { id: exists.id },
        data: {
          name: u.name,
          role: u.role,
          internoProfile: u.internoProfile,
          specialty: u.specialty,
          tenantId,
        },
      });
      continue;
    }
    await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        password: DEMO_PASSWORD,
        role: u.role,
        internoProfile: u.internoProfile,
        specialty: u.specialty,
        tenantId,
      },
    });
  }

  for (const email of CEDIG_LEGACY_PROVIDER_ALIASES) {
    const legacy = await prisma.user.findUnique({ where: { email } });
    if (!legacy || legacy.tenantId !== tenantId) continue;
    if (legacy.role !== "PRESTADOR") continue;
    await prisma.user.update({
      where: { id: legacy.id },
      data: {
        role: "INTERNO",
        internoProfile: "READONLY",
        specialty: "Alias legado (não usar)",
      },
    });
  }
}

/** Empresas institucionais + pacientes + acessos PJ/Beneficiário (demo dos 4 portais). */
async function upsertCedigPortalMass(prisma: PrismaClient, tenantId: string) {
  const companies = [
    {
      name: "CentralMed",
      cnpj: "12.345.678/0001-91",
      tradeName: "CentralMed — encaminhamentos CEDIG",
      status: "ATIVO",
      email: "contato@centralmed.demo",
    },
    {
      name: "Bem Saúde",
      cnpj: "23.456.789/0001-02",
      tradeName: "Bem Saúde",
      status: "ATIVO",
      email: "contato@bemsaude.demo",
    },
    {
      name: "Dr Saúde",
      cnpj: "34.567.890/0001-13",
      tradeName: "Dr Saúde",
      status: "ATIVO",
      email: "contato@drsaude.demo",
    },
  ] as const;

  const companyIds: Record<string, string> = {};
  for (const c of companies) {
    const existing = await prisma.company.findUnique({ where: { cnpj: c.cnpj } });
    if (existing) {
      await prisma.company.update({
        where: { id: existing.id },
        data: {
          name: c.name,
          tradeName: c.tradeName,
          status: c.status,
          email: c.email,
          contractActive: true,
          tenantId,
        },
      });
      companyIds[c.name] = existing.id;
    } else {
      const created = await prisma.company.create({
        data: {
          name: c.name,
          cnpj: c.cnpj,
          tradeName: c.tradeName,
          status: c.status,
          email: c.email,
          contractActive: true,
          tenantId,
        },
      });
      companyIds[c.name] = created.id;
    }
  }

  const pjEmail = "rh@centralmed.demo";
  const pjExisting = await prisma.user.findUnique({ where: { email: pjEmail } });
  if (pjExisting) {
    await prisma.user.update({
      where: { id: pjExisting.id },
      data: {
        name: "RH CentralMed",
        role: "PJ",
        tenantId,
        companyId: companyIds.CentralMed,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email: pjEmail,
        name: "RH CentralMed",
        password: DEMO_PASSWORD,
        role: "PJ",
        tenantId,
        companyId: companyIds.CentralMed,
      },
    });
  }

  const patients = [
    {
      name: "Maria Silva Cedig",
      cpf: "901.111.222-33",
      email: "maria.cedig@email.com",
      phone: "(12) 98888-1001",
      birthDate: new Date("1985-03-12"),
      companyName: "CentralMed" as const,
      bondType: "TITULAR",
    },
    {
      name: "José Santos Cedig",
      cpf: "901.222.333-44",
      email: "jose.cedig@email.com",
      phone: "(12) 98888-1002",
      birthDate: new Date("1978-07-22"),
      companyName: "Bem Saúde" as const,
      bondType: "TITULAR",
    },
    {
      name: "Ana Particular Cedig",
      cpf: "901.333.444-55",
      email: "ana.cedig@email.com",
      phone: "(12) 98888-1003",
      birthDate: new Date("1992-11-05"),
      companyName: null,
      bondType: null,
    },
  ];

  for (const pat of patients) {
    const companyId = pat.companyName ? companyIds[pat.companyName] : null;
    const existing = await prisma.patient.findUnique({ where: { cpf: pat.cpf } });
    let patientId: string;
    if (existing) {
      await prisma.patient.update({
        where: { id: existing.id },
        data: {
          name: pat.name,
          email: pat.email,
          phone: pat.phone,
          birthDate: pat.birthDate,
          tenantId,
          companyId,
          bondType: pat.bondType,
          consentAt: existing.consentAt ?? new Date(),
          consentVersion: existing.consentVersion ?? "v1-poc",
        },
      });
      patientId = existing.id;
    } else {
      const created = await prisma.patient.create({
        data: {
          name: pat.name,
          cpf: pat.cpf,
          email: pat.email,
          phone: pat.phone,
          birthDate: pat.birthDate,
          tenantId,
          companyId,
          bondType: pat.bondType ?? undefined,
          consentAt: new Date(),
          consentVersion: "v1-poc",
        },
      });
      patientId = created.id;
    }

    const userExisting = await prisma.user.findUnique({ where: { email: pat.email } });
    if (userExisting) {
      await prisma.user.update({
        where: { id: userExisting.id },
        data: {
          name: pat.name,
          role: "BENEFICIARIO",
          tenantId,
          patientId,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          email: pat.email,
          name: pat.name,
          password: DEMO_PASSWORD,
          role: "BENEFICIARIO",
          tenantId,
          patientId,
        },
      });
    }
  }
}

/**
 * Histórico mínimo para demos dos 4 portais (idempotente por notes marker).
 */
async function seedCedigOperationalHistory(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  const marker = "[seed-cedig-demo]";
  const existingLaunch = await prisma.clinicExamLaunch.findFirst({
    where: { tenantId, notes: { contains: marker } },
  });
  if (existingLaunch) return;

  const bruno = await prisma.user.findUnique({
    where: { email: "bruno.dias@cedig.demo" },
  });
  const luiza = await prisma.user.findUnique({
    where: { email: "luiza.lage@cedig.demo" },
  });
  const alexandre = await prisma.user.findUnique({
    where: { email: "alexandre.marcal@cedig.demo" },
  });
  const maria = await prisma.patient.findUnique({ where: { cpf: "901.111.222-33" } });
  const jose = await prisma.patient.findUnique({ where: { cpf: "901.222.333-44" } });
  const ana = await prisma.patient.findUnique({ where: { cpf: "901.333.444-55" } });
  const endo = await prisma.procedure.findUnique({
    where: { tenantId_code: { tenantId, code: "CEDIG-ENDO" } },
  });
  const colo = await prisma.procedure.findUnique({
    where: { tenantId_code: { tenantId, code: "CEDIG-COLO" } },
  });
  const resp = await prisma.procedure.findUnique({
    where: { tenantId_code: { tenantId, code: "CEDIG-RESP" } },
  });

  if (!bruno || !luiza || !alexandre || !maria || !jose || !ana || !endo || !colo || !resp) {
    return;
  }

  const today = new Date();
  const at = (hour: number, dayOffset = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  await prisma.appointment.createMany({
    data: [
      {
        tenantId,
        patientId: maria.id,
        providerId: bruno.id,
        procedureId: endo.id,
        scheduledAt: at(9),
        status: "CONFIRMADO",
        modality: "PRESENCIAL",
        reason: "Exame — Endoscopia Digestiva Alta",
      },
      {
        tenantId,
        patientId: jose.id,
        providerId: luiza.id,
        procedureId: colo.id,
        scheduledAt: at(10),
        status: "CONFIRMADO",
        modality: "PRESENCIAL",
        reason: "Exame — Colonoscopia",
      },
      {
        tenantId,
        patientId: ana.id,
        providerId: alexandre.id,
        procedureId: colo.id,
        scheduledAt: at(14, -1),
        status: "REALIZADO",
        modality: "PRESENCIAL",
        reason: "Exame — Colonoscopia + polipectomia",
      },
    ],
  });

  await prisma.clinicExamLaunch.createMany({
    data: [
      {
        tenantId,
        patientId: maria.id,
        patientName: maria.name,
        providerId: bruno.id,
        procedureId: endo.id,
        performedAt: at(9, -2),
        paymentMethod: "PIX",
        priceTable: "PARTICULAR",
        amountReceived: 900,
        biopsies: 1,
        notes: `${marker} C1 homolog`,
      },
      {
        tenantId,
        patientId: jose.id,
        patientName: jose.name,
        providerId: luiza.id,
        procedureId: colo.id,
        performedAt: at(10, -2),
        paymentMethod: "CONVENIO",
        priceTable: "CENTRALMED",
        amountReceived: 1250,
        notes: `${marker} C2 homolog`,
      },
      {
        tenantId,
        patientId: ana.id,
        patientName: ana.name,
        providerId: alexandre.id,
        procedureId: colo.id,
        performedAt: at(14, -1),
        paymentMethod: "CARTAO",
        priceTable: "PARTICULAR",
        amountReceived: 3200,
        polypectomies: 1,
        polypectomyTier: "INTERMEDIARIA",
        clips: 1,
        notes: `${marker} C3 homolog`,
      },
      {
        tenantId,
        patientId: maria.id,
        patientName: maria.name,
        providerId: alexandre.id,
        procedureId: resp.id,
        performedAt: at(11, -1),
        paymentMethod: "CONVENIO",
        priceTable: "BEM_SAUDE",
        amountReceived: 450,
        notes: `${marker} C4 homolog`,
      },
    ],
  });

  await prisma.clinicExpense.createMany({
    data: [
      {
        tenantId,
        category: "LABORATORIO",
        description: `${marker} Lab biópsias — demo`,
        amount: 300,
        expenseDate: at(8, -1),
      },
      {
        tenantId,
        category: "PESSOAL",
        description: `${marker} Pagamento equipe — demo`,
        amount: 500,
        expenseDate: at(8, -1),
      },
    ],
  });
}

export type EnsureCedigTenantOptions = {
  /** Inclui lançamentos/agenda de homologação (padrão: true na massa demo). */
  seedHistory?: boolean;
};

/**
 * Garante tenant CEDIG (demo ou operação) com branding e catálogo.
 * Idempotente por slug `cedig`.
 */
export async function ensureCedigTenant(
  prisma: PrismaClient,
  options: EnsureCedigTenantOptions = {},
): Promise<{
  tenantId: string;
  created: boolean;
  procedures: number;
}> {
  const seedHistory = options.seedHistory !== false;
  const existing = await prisma.tenant.findUnique({ where: { slug: "cedig" } });
  if (existing) {
    const procedures = await upsertCedigProcedures(prisma, existing.id);
    await prisma.tenant.update({
      where: { id: existing.id },
      data: {
        labels: serializeTenantLabels("MEDICAL", { ...CEDIG_LABEL_OVERRIDES }),
      },
    });
    await upsertCedigStaff(prisma, existing.id);
    await upsertCedigPortalMass(prisma, existing.id);
    if (seedHistory) {
      await seedCedigOperationalHistory(prisma, existing.id);
    }
    return { tenantId: existing.id, created: false, procedures };
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: "CEDIG Cruzeiro",
      slug: "cedig",
      cnpj: "54.321.098/0001-77",
      niche: "MEDICAL",
      labels: serializeTenantLabels("MEDICAL", { ...CEDIG_LABEL_OVERRIDES }),
      branding: {
        create: {
          displayName: "CEDIG Cruzeiro",
          tagline: "Centro de Endoscopia e Diagnóstico — Cruzeiro/SP",
          primaryColor: "#0f766e",
          accentColor: "#0ea5e9",
          heroFrom: "#134e4a",
          heroTo: "#0ea5e9",
          platformLabel: "Powered by Sistema Bibi - ServiceOS",
          colorScheme: "light",
        },
      },
    },
  });

  const procedures = await upsertCedigProcedures(prisma, tenant.id);
  await upsertCedigStaff(prisma, tenant.id);
  await upsertCedigPortalMass(prisma, tenant.id);
  if (seedHistory) {
    await seedCedigOperationalHistory(prisma, tenant.id);
  }

  return { tenantId: tenant.id, created: true, procedures };
}
