import type { PrismaClient } from "@prisma/client";
import type { NicheOperationalConfig } from "./niche-catalogs";
import type { ScaleConfig } from "./scale";
import type { SeedProfileConfig } from "./profile";
import type { PatientRef, ProcedureRef } from "./scenarios";
import type { SeedCompany } from "./companies";
import { generatePjUsers } from "./generators";
import { seedMonthlyRevenueBaseline } from "./monthly-baseline";
import { seedNicheClinicalDemo } from "./niche-clinical-demos";
import { seedNicheStock } from "./niche-stock-demo";
import { seedNicheStarFlows, type StarPatientRef } from "./niche-star-flows";
import { ALL_SEED_PROCEDURES } from "./pricing-market";

export type NicheRichSeedInput = {
  prisma: PrismaClient;
  password: string;
  tenantId: string;
  config: NicheOperationalConfig;
  scale: ScaleConfig;
  profile: SeedProfileConfig;
  procedures: Record<string, ProcedureRef>;
  providerIds: string[];
  internoId: string;
  companyIdByIndex: Map<number, string>;
  discountByCompanyIndex: Map<number, number>;
  patients: PatientRef[];
  starPatientIds: Set<string>;
  starRefs: StarPatientRef[];
};

/** Escala da massa operacional por nicho — mais rica em operation-1y. */
export function resolveNicheOperationalScale(
  scale: ScaleConfig,
  profile: SeedProfileConfig,
): ScaleConfig {
  if (profile.profile === "operation-1y") {
    return {
      ...scale,
      appointmentCount: Math.max(100, Math.round(scale.appointmentCount * 0.75)),
      messageCount: Math.max(36, Math.round(scale.messageCount * 0.75)),
      beneficiaryPortalUsers: Math.min(12, scale.beneficiaryPortalUsers),
      baselineMonths: scale.baselineMonths,
    };
  }
  return {
    ...scale,
    appointmentCount: Math.max(35, Math.round(scale.appointmentCount * 0.45)),
    messageCount: Math.max(12, Math.round(scale.messageCount * 0.35)),
    beneficiaryPortalUsers: Math.min(6, scale.beneficiaryPortalUsers),
    baselineMonths: Math.min(6, scale.baselineMonths),
  };
}

/** Equipe interna por tenant — RBAC espelhando Horizonte (recepção + faturamento). */
export async function seedNicheInternoTeam(
  prisma: PrismaClient,
  password: string,
  tenantId: string,
  slug: string,
): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: `recepcao@${slug}.demo` },
  });
  if (existing) return;

  await prisma.user.createMany({
    data: [
      {
        email: `recepcao@${slug}.demo`,
        password,
        name: `Recepção ${slug}`,
        role: "INTERNO",
        internoProfile: "RECEPCAO",
        tenantId,
      },
      {
        email: `financeiro@${slug}.demo`,
        password,
        name: `Financeiro ${slug}`,
        role: "INTERNO",
        internoProfile: "FATURAMENTO",
        tenantId,
      },
    ],
  });
}

/** Equipe PJ 3–9 usuários por parceiro com contrato (perfil operation-1y). */
export async function seedNichePjTeam(
  prisma: PrismaClient,
  password: string,
  tenantId: string,
  companies: SeedCompany[],
  companyIdByIndex: Map<number, string>,
  profile: SeedProfileConfig,
): Promise<number> {
  const pjUsers = generatePjUsers(companies, profile);
  let created = 0;
  for (const pj of pjUsers) {
    const companyId = companyIdByIndex.get(pj.companyIndex);
    if (!companyId) continue;
    const exists = await prisma.user.findUnique({ where: { email: pj.email } });
    if (exists) continue;
    await prisma.user.create({
      data: {
        email: pj.email,
        password,
        name: pj.name,
        role: "PJ",
        tenantId,
        companyId,
      },
    });
    created += 1;
  }
  return created;
}

/** Regras de desconto corporativo por parceiro. */
export async function seedNichePricingRules(
  prisma: PrismaClient,
  tenantId: string,
  companies: SeedCompany[],
  companyIdByIndex: Map<number, string>,
  procedures: Record<string, ProcedureRef>,
  discountByCompanyIndex: Map<number, number>,
): Promise<number> {
  let count = 0;
  for (const company of companies) {
    const discount = discountByCompanyIndex.get(company.index);
    if (!discount) continue;
    const companyId = companyIdByIndex.get(company.index);
    if (!companyId) continue;
    const discountPct = Math.round((1 - discount) * 100);
    for (const proc of Object.values(procedures)) {
      if (proc.category !== "CONSULTA" && proc.category !== "SESSAO" && proc.category !== "SERVICO") {
        continue;
      }
      await prisma.pricingRule.create({
        data: {
          description: `Desconto ${company.name.split(" ")[0]} (${discountPct}%) — ${proc.name}`,
          multiplier: discount,
          procedureId: proc.id,
          companyId,
        },
      });
      count += 1;
    }
  }
  return count;
}

/** Webhook B2B demo por tenant. */
export async function seedNicheWebhook(
  prisma: PrismaClient,
  tenantId: string,
  slug: string,
  partnerName: string,
): Promise<void> {
  const exists = await prisma.webhookEndpoint.findFirst({ where: { tenantId } });
  if (exists) return;
  await prisma.webhookEndpoint.create({
    data: {
      tenantId,
      label: `ERP ${partnerName} (${slug})`,
      url: `https://webhook.site/demo-bibi-${slug}`,
      secret: `demo-webhook-${slug}`,
      events: JSON.stringify(["INVOICE_ISSUED", "APPOINTMENT_CREATED", "COMPANY_STATUS_CHANGED"]),
    },
  });
}

/** Massa rica completa pós-operacional — star flows, clínico, estoque, baseline, PJ. */
export async function seedNicheRichMass(input: NicheRichSeedInput): Promise<{
  pjUsers: number;
  pricingRules: number;
  stockProducts: number;
}> {
  const companiesForMass: SeedCompany[] = input.config.companies.map((c, idx) => ({
    index: idx + 1,
    name: c.name,
    cnpj: c.cnpj,
    status: c.status,
    sector: c.sector,
    useCase: `${input.config.slug} — ${c.sector}`,
    beneficiaryCount: c.beneficiaries,
    clinicalDiscount: c.clinicalDiscount,
    pjEmail: idx === 0 ? input.config.pjEmail : undefined,
  }));

  const pjUsers = await seedNichePjTeam(
    input.prisma,
    input.password,
    input.tenantId,
    companiesForMass,
    input.companyIdByIndex,
    input.profile,
  );

  const pricingRules = await seedNichePricingRules(
    input.prisma,
    input.tenantId,
    companiesForMass,
    input.companyIdByIndex,
    input.procedures,
    input.discountByCompanyIndex,
  );

  const stockProducts = await seedNicheStock(
    input.prisma,
    input.tenantId,
    input.config.niche,
  );

  const primaryStar = input.starRefs[0];
  if (primaryStar) {
    const ag = await input.prisma.appointment.findFirst({
      where: { tenantId: input.tenantId, patientId: primaryStar.patientId },
      orderBy: { scheduledAt: "desc" },
    });
    if (input.config.niche !== "VET") {
      await seedNicheClinicalDemo(input.prisma, input.config.niche, {
        tenantId: input.tenantId,
        patientId: primaryStar.patientId,
        providerId: input.providerIds[0]!,
        appointmentId: ag?.id,
      });
    }
  }

  await seedNicheStarFlows({
    prisma: input.prisma,
    tenantId: input.tenantId,
    config: input.config,
    procedures: input.procedures,
    providerId: input.providerIds[0]!,
    internoId: input.internoId,
    stars: input.starRefs,
  });

  await seedMonthlyRevenueBaseline({
    prisma: input.prisma,
    tenantId: input.tenantId,
    internoId: input.internoId,
    patients: input.patients,
    companies: companiesForMass,
    companyIdByIndex: input.companyIdByIndex,
    scale: input.scale,
  });

  const partner = input.config.companies.find((c) => c.status === "ATIVO")?.name ?? input.config.slug;
  await seedNicheWebhook(input.prisma, input.tenantId, input.config.slug, partner.split(" ")[0]!);

  return { pjUsers, pricingRules, stockProducts };
}

/** VitaCare também recebe estoque médico quando MEDICAL. */
export async function seedVitacareStock(
  prisma: PrismaClient,
  tenantId: string,
  procedures: Record<string, ProcedureRef>,
): Promise<void> {
  const { seedMedicalStock } = await import("./stock-demo");
  const procMap: Record<string, { id: string; code: string }> = {};
  for (const [code, p] of Object.entries(procedures)) {
    procMap[code] = { id: p.id, code };
  }
  if (Object.keys(procMap).length === 0) {
    for (const p of ALL_SEED_PROCEDURES.slice(0, 6)) {
      const row = await prisma.procedure.findFirst({
        where: { tenantId, code: p.code },
        select: { id: true, code: true },
      });
      if (row) procMap[p.code] = row;
    }
  }
  if (Object.keys(procMap).length > 0) {
    await seedMedicalStock(prisma, tenantId, procMap);
  }
}
