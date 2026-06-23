import type { PrismaClient } from "@prisma/client";
import { serializeTenantLabels } from "../../src/constants/niches";
import { getNicheConfig } from "../../src/lib/niche/defaults";
import type { NicheId } from "../../src/lib/niche/types";

type NicheDemo = {
  niche: NicheId;
  name: string;
  cnpj: string;
  displayName: string;
  internoEmail: string;
  providerEmail: string;
  procedures: Array<{
    code: string;
    name: string;
    category: string;
    serviceType: string;
    basePrice: number;
  }>;
};

const NICHE_DEMOS: NicheDemo[] = [
  {
    niche: "VET",
    name: "PetCare Clínica Veterinária",
    cnpj: "11.111.111/0001-11",
    displayName: "PetCare",
    internoEmail: "operacao@petcare.demo",
    providerEmail: "dr.rafael@petcare.demo",
    procedures: [
      { code: "VET-CON", name: "Consulta Veterinária", category: "CONSULTA", serviceType: "CLINICA", basePrice: 180 },
      { code: "VET-BAN", name: "Banho e Tosa", category: "SERVICO", serviceType: "ESTETICA", basePrice: 150 },
      { code: "VET-VAC", name: "Vacinação", category: "SERVICO", serviceType: "PREVENTIVO", basePrice: 120 },
    ],
  },
  {
    niche: "DENTAL",
    name: "Smile Odontologia",
    cnpj: "22.222.222/0001-22",
    displayName: "Smile Odonto",
    internoEmail: "operacao@smile.demo",
    providerEmail: "dra.camila@smile.demo",
    procedures: [
      { code: "DEN-CON", name: "Consulta Odontológica", category: "CONSULTA", serviceType: "CLINICA", basePrice: 350 },
      { code: "DEN-LIM", name: "Limpeza e Profilaxia", category: "SERVICO", serviceType: "PREVENTIVO", basePrice: 280 },
      { code: "DEN-RX", name: "Radiografia Panorâmica", category: "EXAME", serviceType: "DIAGNOSTICO", basePrice: 150 },
    ],
  },
  {
    niche: "LEGAL",
    name: "Lex & Partners Advocacia",
    cnpj: "33.333.333/0001-33",
    displayName: "Lex & Partners",
    internoEmail: "operacao@lex.demo",
    providerEmail: "dr.andre@lex.demo",
    procedures: [
      { code: "LEG-HT", name: "Hora Técnica Jurídica", category: "SESSAO", serviceType: "JURIDICO", basePrice: 500 },
      { code: "LEG-PAR", name: "Parecer Jurídico", category: "SERVICO", serviceType: "JURIDICO", basePrice: 600 },
      { code: "LEG-CON", name: "Consulta Inicial", category: "CONSULTA", serviceType: "JURIDICO", basePrice: 350 },
    ],
  },
  {
    niche: "SPA",
    name: "Zen Studio Bem-estar",
    cnpj: "44.444.444/0001-44",
    displayName: "Zen Studio",
    internoEmail: "operacao@zen.demo",
    providerEmail: "instrutora.lia@zen.demo",
    procedures: [
      { code: "SPA-MSG", name: "Massagem Relaxante (60min)", category: "SESSAO", serviceType: "SPA", basePrice: 180 },
      { code: "SPA-YOG", name: "Aula de Yoga", category: "SESSAO", serviceType: "WELLNESS", basePrice: 120 },
      { code: "SPA-FAC", name: "Tratamento Facial", category: "SERVICO", serviceType: "ESTETICA", basePrice: 220 },
    ],
  },
  {
    niche: "EDUCATION",
    name: "EduPrime Cursos",
    cnpj: "55.555.555/0001-55",
    displayName: "EduPrime",
    internoEmail: "operacao@eduprime.demo",
    providerEmail: "prof.marcos@eduprime.demo",
    procedures: [
      { code: "EDU-AUL", name: "Aula Particular (60min)", category: "SESSAO", serviceType: "EDUCACAO", basePrice: 150 },
      { code: "EDU-WKS", name: "Workshop Corporativo", category: "SERVICO", serviceType: "CAPACITACAO", basePrice: 800 },
      { code: "EDU-MEN", name: "Mentoria Individual", category: "SESSAO", serviceType: "MENTORIA", basePrice: 200 },
    ],
  },
];

export type NicheSeedResult = {
  tenants: number;
  procedures: number;
};

/** Cria tenants demo para cada nicho ServiceOS (v2.0). */
export async function seedNicheTenants(
  prisma: PrismaClient,
  password: string,
): Promise<NicheSeedResult> {
  let procedureCount = 0;

  for (const demo of NICHE_DEMOS) {
    const config = getNicheConfig(demo.niche);
    const labelOverrides =
      demo.niche === "VET"
        ? { appointment: "Banho/Tosa", appointments: "Banhos e Tosas" }
        : undefined;
    const tenant = await prisma.tenant.create({
      data: {
        name: demo.name,
        cnpj: demo.cnpj,
        niche: demo.niche,
        labels: serializeTenantLabels(demo.niche, labelOverrides),
        branding: {
          create: {
            displayName: demo.displayName,
            tagline: config.tagline,
            primaryColor: config.branding.primaryColor,
            accentColor: config.branding.accentColor,
            heroFrom: config.branding.heroFrom,
            heroTo: config.branding.heroTo,
            platformLabel: "Powered by ServiceOS Bibi",
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

    await prisma.user.create({
      data: {
        email: demo.providerEmail,
        password,
        name: demo.niche === "LEGAL" ? "Dr. André Lex" : `Profissional ${demo.displayName}`,
        role: "PRESTADOR",
        tenantId: tenant.id,
        specialty: config.name,
      },
    });

    for (const proc of demo.procedures) {
      await prisma.procedure.create({
        data: {
          ...proc,
          tenantId: tenant.id,
        },
      });
      procedureCount += 1;
    }
  }

  return { tenants: NICHE_DEMOS.length, procedures: procedureCount };
}

export { NICHE_DEMOS };
