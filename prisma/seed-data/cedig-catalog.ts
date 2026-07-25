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
  // aliases legados do primeiro seed
  {
    email: "bruno@cedig.demo",
    name: "Dr. Bruno Dias",
    role: "PRESTADOR",
    internoProfile: null,
    specialty: "Endoscopia digestiva",
  },
  {
    email: "luiza@cedig.demo",
    name: "Dra. Luiza Lage",
    role: "PRESTADOR",
    internoProfile: null,
    specialty: "Endoscopia digestiva",
  },
] as const;

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
}

/**
 * Garante tenant CEDIG (demo ou operação) com branding e catálogo.
 * Idempotente por slug `cedig`.
 */
export async function ensureCedigTenant(prisma: PrismaClient): Promise<{
  tenantId: string;
  created: boolean;
  procedures: number;
}> {
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

  return { tenantId: tenant.id, created: true, procedures };
}
