import type { PrismaClient } from "@prisma/client";
import { serializeTenantLabels } from "../../src/constants/niches";
import { getNicheConfig } from "../../src/lib/niche/defaults";
import type { NicheId } from "../../src/lib/niche/types";
import {
  NICHE_OPERATIONAL_CONFIGS,
  type NicheOperationalConfig,
  type NicheProcedureSeed,
} from "./niche-catalogs";

export type NicheDemo = {
  niche: NicheId;
  slug: string;
  name: string;
  cnpj: string;
  displayName: string;
  internoEmail: string;
  procedures: NicheProcedureSeed[];
  providers: NicheOperationalConfig["providers"];
};

/** Demos multi-nicho — catálogos e prestadores em niche-catalogs.ts */
export const NICHE_DEMOS: NicheDemo[] = NICHE_OPERATIONAL_CONFIGS.map((config) => ({
  niche: config.niche,
  slug: config.slug,
  name: config.niche === "VET"
    ? "PetCare Clínica Veterinária"
    : config.niche === "DENTAL"
      ? "Smile Odontologia"
      : config.niche === "LEGAL"
        ? "Lex & Partners Advocacia"
        : config.niche === "SPA"
          ? "Zen Studio Bem-estar"
          : "EduPrime Cursos",
  cnpj: config.niche === "VET"
    ? "11.111.111/0001-11"
    : config.niche === "DENTAL"
      ? "22.222.222/0001-22"
      : config.niche === "LEGAL"
        ? "33.333.333/0001-33"
        : config.niche === "SPA"
          ? "44.444.444/0001-44"
          : "55.555.555/0001-55",
  displayName: config.niche === "VET"
    ? "PetCare"
    : config.niche === "DENTAL"
      ? "Smile Odonto"
      : config.niche === "LEGAL"
        ? "Lex & Partners"
        : config.niche === "SPA"
          ? "Zen Studio"
          : "EduPrime",
  internoEmail: `operacao@${config.slug}.demo`,
  procedures: config.procedures,
  providers: config.providers,
}));

export type NicheSeedResult = {
  tenants: number;
  procedures: number;
  providers: number;
};

/** Cria tenants demo para cada nicho ServiceOS (v2.0). */
export async function seedNicheTenants(
  prisma: PrismaClient,
  password: string,
): Promise<NicheSeedResult> {
  let procedureCount = 0;
  let providerCount = 0;

  for (const demo of NICHE_DEMOS) {
    const config = getNicheConfig(demo.niche);
    const tenant = await prisma.tenant.create({
      data: {
        name: demo.name,
        slug: demo.slug,
        cnpj: demo.cnpj,
        niche: demo.niche,
        labels: serializeTenantLabels(demo.niche),
        branding: {
          create: {
            displayName: demo.displayName,
            tagline: config.tagline,
            primaryColor: config.branding.primaryColor,
            accentColor: config.branding.accentColor,
            heroFrom: config.branding.heroFrom,
            heroTo: config.branding.heroTo,
            platformLabel: "Powered by Sistema Bibi - ServiceOS",
            colorScheme: "light",
          },
        },
      },
    });

    await prisma.user.create({
      data: {
        email: demo.internoEmail,
        password,
        name: `Operação ${demo.displayName}`,
        role: "INTERNO",
        internoProfile: "ADMIN",
        tenantId: tenant.id,
      },
    });

    for (const provider of demo.providers) {
      await prisma.user.create({
        data: {
          email: provider.email,
          password,
          name: provider.name,
          role: "PRESTADOR",
          tenantId: tenant.id,
          specialty: provider.specialty,
          councilType: provider.councilType,
          councilNumber: provider.councilNumber,
          councilUf: provider.councilUf,
          phone: provider.phone,
        },
      });
      providerCount += 1;
    }

    for (const proc of demo.procedures) {
      await prisma.procedure.create({
        data: {
          code: proc.code,
          name: proc.name,
          category: proc.category,
          serviceType: proc.serviceType,
          basePrice: proc.basePrice,
          tissCode: proc.tissCode,
          tenantId: tenant.id,
        },
      });
      procedureCount += 1;
    }
  }

  return { tenants: NICHE_DEMOS.length, procedures: procedureCount, providers: providerCount };
}

export { NICHE_OPERATIONAL_CONFIGS };
