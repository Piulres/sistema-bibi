/**
 * Catálogo operacional CEDIG Cruzeiro — endoscopia / colonoscopia.
 * Usado no seed de demo e pode ser aplicado ao tenant em modo operação.
 */
import type { PrismaClient } from "@prisma/client";
import { serializeTenantLabels } from "../../src/constants/niches";
import { hashPassword } from "../../src/lib/password";

const DEMO_PASSWORD = hashPassword("bibi123");

export const CEDIG_PROCEDURES = [
  {
    code: "CEDIG-ENDO",
    name: "Endoscopia digestiva alta",
    category: "EXAME",
    serviceType: "ENDOSCOPIA",
    basePrice: 650,
    tissCode: null as string | null,
  },
  {
    code: "CEDIG-COLO",
    name: "Colonoscopia",
    category: "EXAME",
    serviceType: "ENDOSCOPIA",
    basePrice: 900,
    tissCode: null,
  },
  {
    code: "CEDIG-ENDO-COLO",
    name: "Endoscopia + Colonoscopia",
    category: "EXAME",
    serviceType: "ENDOSCOPIA",
    basePrice: 1400,
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

  const users = [
    {
      email: "operacao@cedig.demo",
      name: "Operação CEDIG",
      role: "INTERNO",
      internoProfile: "ADMIN",
      specialty: null as string | null,
    },
    {
      email: "recepcao@cedig.demo",
      name: "Secretária CEDIG",
      role: "INTERNO",
      internoProfile: "RECEPCAO",
      specialty: null,
    },
    {
      email: "bruno@cedig.demo",
      name: "Dr. Bruno",
      role: "PRESTADOR",
      internoProfile: null,
      specialty: "Endoscopia digestiva",
    },
    {
      email: "luiza@cedig.demo",
      name: "Dra. Luiza",
      role: "PRESTADOR",
      internoProfile: null,
      specialty: "Endoscopia digestiva",
    },
  ] as const;

  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (exists) continue;
    await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        password: DEMO_PASSWORD,
        role: u.role,
        internoProfile: u.internoProfile,
        specialty: u.specialty,
        tenantId: tenant.id,
      },
    });
  }

  return { tenantId: tenant.id, created: true, procedures };
}
