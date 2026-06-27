import "server-only";
import { getPrisma } from "@/lib/db";

/** Resolve beneficiário para fatura de obra — prioriza e-mail demo do contratante. */
export async function resolveInvoicePatientForCompany(
  tenantId: string,
  companyId: string,
  preferredBeneficiaryEmail?: string,
) {
  const prisma = await getPrisma();

  if (preferredBeneficiaryEmail) {
    const user = await prisma.user.findFirst({
      where: {
        tenantId,
        email: preferredBeneficiaryEmail,
        patientId: { not: null },
      },
      select: { patientId: true },
    });
    if (user?.patientId) {
      const patient = await prisma.patient.findFirst({
        where: { id: user.patientId, tenantId, companyId },
      });
      if (patient) return patient;
    }
  }

  return prisma.patient.findFirst({
    where: { tenantId, companyId },
    orderBy: { createdAt: "asc" },
  });
}
