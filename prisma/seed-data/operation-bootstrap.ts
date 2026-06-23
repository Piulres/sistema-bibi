/**
 * Bootstrap mínimo para modo operação — tenant, usuários essenciais e catálogo.
 * Sem massa PJ/beneficiários; dados reais entram pelo uso do sistema.
 */
import { PrismaClient } from "@prisma/client";
import { serializeTenantLabels } from "../../src/constants/niches";
import { hashPassword } from "../../src/lib/password";
import { ALL_SEED_PROCEDURES } from "./pricing-market";
import { currentTotpCode, DEMO_MFA_SECRET } from "./totp-demo";

const DEMO_PASSWORD = hashPassword("bibi123");

export type OperationBootstrapResult = {
  tenantId: string;
  users: number;
  procedures: number;
};

export async function runOperationBootstrap(
  prisma: PrismaClient,
): Promise<OperationBootstrapResult> {
  const existingTenant = await prisma.tenant.findFirst();
  if (existingTenant) {
    const users = await prisma.user.count();
    const procedures = await prisma.procedure.count();
    return {
      tenantId: existingTenant.id,
      users,
      procedures,
    };
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: "Clínica Bibi Saúde",
      slug: "bibi-saude",
      cnpj: "12.345.678/0001-90",
      niche: "MEDICAL",
      labels: serializeTenantLabels("MEDICAL"),
      branding: {
        create: {
          displayName: "Clínica Bibi Saúde",
          tagline: "Cuidado humanizado com gestão inteligente",
          primaryColor: "#0d9488",
          accentColor: "#14b8a6",
          heroFrom: "#0f172a",
          heroTo: "#134e4a",
          platformLabel: "Powered by Sistema Bibi - ServiceOS",
          colorScheme: "light",
        },
      },
    },
  });

  const users = [
    {
      email: "dra.helena@bibi.health",
      name: "Dra. Helena Martins",
      role: "PRESTADOR",
      internoProfile: null,
      mfaEnabled: false,
      mfaSecret: null,
    },
    {
      email: "faturamento@bibi.health",
      name: "Carlos Faturamento",
      role: "INTERNO",
      internoProfile: "ADMIN",
      mfaEnabled: false,
      mfaSecret: null,
    },
    {
      email: "recepcao@bibi.health",
      name: "Paula Recepção",
      role: "INTERNO",
      internoProfile: "RECEPCAO",
      mfaEnabled: false,
      mfaSecret: null,
    },
    {
      email: "financeiro@bibi.health",
      name: "Fernanda Financeiro",
      role: "INTERNO",
      internoProfile: "FATURAMENTO",
      mfaEnabled: false,
      mfaSecret: null,
    },
    {
      email: "seguranca@bibi.health",
      name: "Admin Segurança (MFA)",
      role: "INTERNO",
      internoProfile: "ADMIN",
      mfaEnabled: true,
      mfaSecret: DEMO_MFA_SECRET,
    },
  ] as const;

  for (const u of users) {
    await prisma.user.create({
      data: {
        email: u.email,
        password: DEMO_PASSWORD,
        name: u.name,
        role: u.role,
        internoProfile: u.internoProfile,
        mfaEnabled: u.mfaEnabled,
        mfaSecret: u.mfaSecret,
        tenantId: tenant.id,
      },
    });
  }

  for (const p of ALL_SEED_PROCEDURES) {
    await prisma.procedure.create({
      data: { ...p, tenantId: tenant.id },
    });
  }

  console.log("  Operação — bootstrap mínimo:");
  console.log("  Prestador  -> dra.helena@bibi.health / bibi123");
  console.log("  Interno    -> faturamento@bibi.health / bibi123 (ADMIN)");
  console.log("  Recepção   -> recepcao@bibi.health / bibi123");
  console.log(`  MFA demo   -> seguranca@bibi.health / bibi123 + TOTP ${currentTotpCode(DEMO_MFA_SECRET)}`);

  return {
    tenantId: tenant.id,
    users: users.length,
    procedures: ALL_SEED_PROCEDURES.length,
  };
}
