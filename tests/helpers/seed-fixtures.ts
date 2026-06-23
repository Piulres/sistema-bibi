import { DEMO_PRESTADOR_HELENA } from "../../prisma/seed-data/catalog";

/** E-mails estáveis da massa demo — espelham prisma/seed-data. */
export const DEMO_EMAILS = {
  prestador: DEMO_PRESTADOR_HELENA.email,
  internoAdmin: "faturamento@bibi.health",
  internoFaturamento: "financeiro@bibi.health",
  internoRecepcao: "recepcao@bibi.health",
  joao: "joao.pereira@email.com",
  maria: "maria.souza@email.com",
  pedro: "pedro.almeida@email.com",
  pjTechcorp: "rh@techcorp.com",
} as const;

export const DEMO_CPFS = {
  joao: "111.222.333-44",
  maria: "555.666.777-88",
  pedro: "999.000.111-22",
} as const;

export async function getBeneficiaryPatient(email: string) {
  const { getTestPrisma } = await import("./db");
  const prisma = getTestPrisma();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { patientId: true, tenantId: true },
  });
  if (!user?.patientId) {
    throw new Error(`Beneficiário não encontrado no seed: ${email}`);
  }
  const patient = await prisma.patient.findUniqueOrThrow({
    where: { id: user.patientId },
  });
  return { ...patient, tenantId: user.tenantId };
}

export async function getDemoJoao() {
  return getBeneficiaryPatient(DEMO_EMAILS.joao);
}

export async function getDemoPedro() {
  return getBeneficiaryPatient(DEMO_EMAILS.pedro);
}

export async function getJoaoPrimaryMedicalRecord() {
  const joao = await getDemoJoao();
  const { getTestPrisma } = await import("./db");
  const prisma = getTestPrisma();
  return prisma.medicalRecord.findFirstOrThrow({
    where: {
      patientId: joao.id,
      recordType: "EVOLUCAO",
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPedroPaidInvoice() {
  const pedro = await getDemoPedro();
  const { getTestPrisma } = await import("./db");
  const prisma = getTestPrisma();
  return prisma.invoice.findFirstOrThrow({
    where: { patientId: pedro.id, status: "PAGA" },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTenantAuditEventCount(): Promise<number> {
  const { getTestPrisma } = await import("./db");
  const prisma = getTestPrisma();
  return prisma.timelineEvent.count();
}

/** Indica se test.db precisa ser re-seedado após mudanças na massa. */
export async function isTestSeedStale(databaseUrl: string): Promise<boolean> {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  try {
    const tenantCount = await prisma.tenant.count();
    if (tenantCount === 0) return true;

    const helena = await prisma.user.findUnique({
      where: { email: DEMO_EMAILS.prestador },
      select: { councilType: true },
    });
    if (!helena?.councilType) return true;

    const joaoReceita = await prisma.medicalRecord.findFirst({
      where: {
        recordType: "RECEITA",
        patient: { cpf: DEMO_CPFS.joao },
      },
      select: { id: true },
    });
    if (!joaoReceita) return true;

    const stockProduct = await prisma.medicalProduct.findFirst({
      where: { sku: "MAT-LUVA-M" },
      select: { id: true },
    });
    if (!stockProduct) return true;

    const horizonte = await prisma.tenant.findFirst({
      where: { cnpj: "12.345.678/0001-90" },
      select: { slug: true, niche: true },
    });
    if (!horizonte?.slug || horizonte.niche !== "MEDICAL") return true;

    const petcare = await prisma.tenant.findFirst({
      where: { slug: "petcare" },
      select: { id: true },
    });
    return !petcare;
  } finally {
    await prisma.$disconnect();
  }
}
