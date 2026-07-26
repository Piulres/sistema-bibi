#!/usr/bin/env node
/**
 * Zera fluxos/atendimentos do tenant CEDIG no operation.db, preservando
 * masters (usuários, procedimentos, empresas, PricingRules, branding).
 *
 * Uso:
 *   node scripts/reset-cedig-transactional.mjs /path/to/operation.db --confirm=LIMPAR-FLUXOS
 *   node scripts/reset-cedig-transactional.mjs /path/to/operation.db --confirm=LIMPAR-FLUXOS --dry-run
 *
 * Remove (tenant slug=cedig):
 *   lançamentos gestão, despesas, pagamentos, faturas, usages, PEP, medicações,
 *   exames, enrollments, appointments, pacientes, timeline do tenant,
 *   charges/assinaturas e mensagens do tenant; desvincula user.patientId.
 *
 * Mantém:
 *   Tenant/Branding, Users (staff/PJ), Procedures, Companies, PricingRules,
 *   templates de protocolo/cuidado, catálogo de estoque.
 *
 * Após editar produção: republicar Blob com metadata updatedAt
 *   (scripts/publish-operation-blob.mjs).
 */
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const dbPath = process.argv[2];
const confirm = process.argv.find((a) => a.startsWith("--confirm="))?.slice("--confirm=".length);
const dryRun = process.argv.includes("--dry-run");

if (!dbPath || !existsSync(dbPath)) {
  console.error(
    "Uso: node scripts/reset-cedig-transactional.mjs <operation.db> --confirm=LIMPAR-FLUXOS [--dry-run]",
  );
  process.exit(1);
}

if (confirm !== "LIMPAR-FLUXOS") {
  console.error('Confirmação obrigatória: --confirm=LIMPAR-FLUXOS');
  process.exit(1);
}

function cuidLike() {
  return `cln${Date.now().toString(36)}${randomBytes(6).toString("hex")}`;
}

const absoluteUrl = dbPath.startsWith("/") ? `file:${dbPath}` : `file:${process.cwd()}/${dbPath}`;
const prisma = new PrismaClient({ datasources: { db: { url: absoluteUrl } } });

async function countCedig(tx, tenantId) {
  return {
    patients: await tx.patient.count({ where: { tenantId } }),
    appointments: await tx.appointment.count({ where: { tenantId } }),
    usages: await tx.procedureUsage.count({ where: { appointment: { tenantId } } }),
    invoices: await tx.invoice.count({ where: { tenantId } }),
    payments: await tx.payment.count({ where: { invoice: { tenantId } } }),
    launches: await tx.clinicExamLaunch.count({ where: { tenantId } }),
    expenses: await tx.clinicExpense.count({ where: { tenantId } }),
    records: await tx.medicalRecord.count({ where: { patient: { tenantId } } }),
    meds: await tx.medicationPrescription.count({ where: { patient: { tenantId } } }),
    exams: await tx.examOrder.count({ where: { patient: { tenantId } } }),
    enrollments: await tx.patientProtocolEnrollment.count({ where: { patient: { tenantId } } }),
    messages: await tx.message.count({ where: { tenantId } }),
    timeline: await tx.timelineEvent.count({ where: { tenantId } }),
    subscriptions: await tx.subscription.count({ where: { tenantId } }),
    charges: await tx.subscriptionCharge.count({
      where: { subscription: { tenantId } },
    }),
    users: await tx.user.count({ where: { tenantId } }),
    procedures: await tx.procedure.count({ where: { tenantId } }),
    companies: await tx.company.count({ where: { tenantId } }),
  };
}

const summary = {
  dryRun,
  before: null,
  after: null,
  deleted: {},
};

try {
  const tenant = await prisma.tenant.findUnique({ where: { slug: "cedig" } });
  if (!tenant) {
    throw new Error('Tenant slug "cedig" não encontrado neste banco.');
  }
  const tenantId = tenant.id;

  summary.before = await countCedig(prisma, tenantId);
  console.log("Antes:", summary.before);

  if (dryRun) {
    console.log("Dry-run: nenhuma alteração escrita.");
    process.exit(0);
  }

  await prisma.$transaction(async (tx) => {
    const patientIds = (
      await tx.patient.findMany({ where: { tenantId }, select: { id: true } })
    ).map((p) => p.id);

    const invoiceIds = (
      await tx.invoice.findMany({ where: { tenantId }, select: { id: true } })
    ).map((i) => i.id);

    const appointmentIds = (
      await tx.appointment.findMany({ where: { tenantId }, select: { id: true } })
    ).map((a) => a.id);

    const launchIds = (
      await tx.clinicExamLaunch.findMany({ where: { tenantId }, select: { id: true } })
    ).map((l) => l.id);

    // 1) Desvincula ponte dos lançamentos (FKs únicos) antes de apagar filhos
    if (launchIds.length) {
      await tx.clinicExamLaunch.updateMany({
        where: { tenantId },
        data: {
          appointmentId: null,
          usageId: null,
          invoiceId: null,
          patientId: null,
        },
      });
    }

    // 2) Pagamentos + itens + faturas
    if (invoiceIds.length) {
      summary.deleted.payments = (
        await tx.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } })
      ).count;
      summary.deleted.invoiceItems = (
        await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } })
      ).count;
      summary.deleted.invoices = (
        await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } })
      ).count;
    } else {
      summary.deleted.payments = 0;
      summary.deleted.invoiceItems = 0;
      summary.deleted.invoices = 0;
    }

    // 3) Usages do tenant (via appointments)
    if (appointmentIds.length) {
      summary.deleted.usages = (
        await tx.procedureUsage.deleteMany({
          where: { appointmentId: { in: appointmentIds } },
        })
      ).count;
    } else {
      summary.deleted.usages = 0;
    }

    // 4) Clínico ligado a pacientes
    if (patientIds.length) {
      summary.deleted.records = (
        await tx.medicalRecord.deleteMany({ where: { patientId: { in: patientIds } } })
      ).count;
      summary.deleted.meds = (
        await tx.medicationPrescription.deleteMany({
          where: { patientId: { in: patientIds } },
        })
      ).count;
      summary.deleted.exams = (
        await tx.examOrder.deleteMany({ where: { patientId: { in: patientIds } } })
      ).count;
      summary.deleted.enrollments = (
        await tx.patientProtocolEnrollment.deleteMany({
          where: { patientId: { in: patientIds } },
        })
      ).count;
      summary.deleted.clinicalProfiles = (
        await tx.patientClinicalProfile.deleteMany({
          where: { patientId: { in: patientIds } },
        })
      ).count;
    } else {
      summary.deleted.records = 0;
      summary.deleted.meds = 0;
      summary.deleted.exams = 0;
      summary.deleted.enrollments = 0;
      summary.deleted.clinicalProfiles = 0;
    }

    // 5) Appointments
    summary.deleted.appointments = (
      await tx.appointment.deleteMany({ where: { tenantId } })
    ).count;

    // 6) Lançamentos e despesas da gestão
    summary.deleted.launches = (
      await tx.clinicExamLaunch.deleteMany({ where: { tenantId } })
    ).count;
    summary.deleted.expenses = (
      await tx.clinicExpense.deleteMany({ where: { tenantId } })
    ).count;

    // 7) Assinaturas / mensagens / timeline do tenant
    const subs = await tx.subscription.findMany({
      where: { tenantId },
      select: { id: true },
    });
    const subIds = subs.map((s) => s.id);
    if (subIds.length) {
      summary.deleted.charges = (
        await tx.subscriptionCharge.deleteMany({
          where: { subscriptionId: { in: subIds } },
        })
      ).count;
      summary.deleted.subscriptions = (
        await tx.subscription.deleteMany({ where: { id: { in: subIds } } })
      ).count;
    } else {
      summary.deleted.charges = 0;
      summary.deleted.subscriptions = 0;
    }

    summary.deleted.messages = (await tx.message.deleteMany({ where: { tenantId } })).count;
    summary.deleted.timeline = (
      await tx.timelineEvent.deleteMany({ where: { tenantId } })
    ).count;

    // 8) Desvincula usuários beneficiário e remove pacientes
    if (patientIds.length) {
      await tx.user.updateMany({
        where: { patientId: { in: patientIds } },
        data: { patientId: null },
      });
      // remove logins BENEFICIARIO órfãos criados só para esses pacientes
      summary.deleted.beneficiaryUsers = (
        await tx.user.deleteMany({
          where: {
            tenantId,
            role: "BENEFICIARIO",
            patientId: null,
            email: { endsWith: "@email.com" },
          },
        })
      ).count;
      summary.deleted.patients = (
        await tx.patient.deleteMany({ where: { id: { in: patientIds } } })
      ).count;
    } else {
      summary.deleted.beneficiaryUsers = 0;
      summary.deleted.patients = 0;
    }

    // 9) Evento de auditoria da limpeza
    await tx.timelineEvent.create({
      data: {
        id: cuidLike(),
        tenantId,
        entityType: "Tenant",
        entityId: tenantId,
        action: "CEDIG_TRANSACTIONAL_RESET",
        description:
          "Reset operacional CEDIG: atendimentos, lançamentos, faturas e pacientes de teste removidos; masters (usuários/procedimentos/valores) preservados",
        metadata: JSON.stringify({
          before: summary.before,
          deleted: summary.deleted,
          keep: ["User", "Procedure", "Company", "PricingRule", "TenantBranding"],
        }),
        correlationId: tenantId,
        reversible: false,
        createdAt: new Date(),
        createdBy: "operacao@cedig.demo",
      },
    });
  });

  summary.after = await countCedig(prisma, tenantId);
  console.log("Removido:", summary.deleted);
  console.log("Depois:", summary.after);
  console.log("✓ Reset CEDIG concluído");
} catch (err) {
  console.error("Falha no reset:", err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
