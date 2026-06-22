import "server-only";
import { getPrisma } from "@/lib/db";

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

/** Exportação LGPD light — dados pessoais e histórico resumido do beneficiário. */
export async function buildPatientLgpdExport(tenantId: string, patientId: string) {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
    include: {
      company: { select: { name: true, cnpj: true } },
      appointments: {
        include: {
          provider: { select: { name: true } },
          usages: { include: { procedure: { select: { code: true, name: true } } } },
        },
        orderBy: { scheduledAt: "desc" },
      },
      medicalRecords: {
        include: { provider: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      invoices: { orderBy: { createdAt: "desc" } },
      subscriptions: {
        include: { charges: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!patient) return null;

  return {
    exportedAt: new Date().toISOString(),
    purpose: "LGPD — portabilidade e transparência (POC)",
    patient: {
      id: patient.id,
      name: patient.name,
      cpf: patient.cpf,
      birthDate: dateOnly(patient.birthDate),
      phone: patient.phone,
      consentAt: patient.consentAt?.toISOString() ?? null,
      consentVersion: patient.consentVersion,
      company: patient.company
        ? { name: patient.company.name, cnpj: patient.company.cnpj }
        : null,
    },
    appointments: patient.appointments.map((a) => ({
      scheduledAt: a.scheduledAt.toISOString(),
      status: a.status,
      provider: a.provider.name,
      reason: a.reason,
      procedures: a.usages.map((u) => ({
        code: u.procedure.code,
        name: u.procedure.name,
        priceCharged: u.priceCharged,
        billed: u.billed,
      })),
    })),
    medicalRecords: patient.medicalRecords.map((r) => ({
      createdAt: r.createdAt.toISOString(),
      recordType: r.recordType,
      title: r.title,
      provider: r.provider.name,
      contentLength: r.content.length,
    })),
    invoices: patient.invoices.map((inv) => ({
      id: inv.id,
      total: inv.total,
      status: inv.status,
      createdAt: inv.createdAt.toISOString(),
    })),
    subscriptions: patient.subscriptions.map((sub) => ({
      status: sub.status,
      billingCycle: sub.billingCycle,
      amount: sub.amount,
      charges: sub.charges.map((c) => ({
        dueDate: c.dueDate.toISOString(),
        amount: c.amount,
        status: c.status,
      })),
    })),
  };
}
