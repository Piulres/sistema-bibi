#!/usr/bin/env node
/**
 * Limpeza pontual do operation.db (modo operação / CEDIG).
 *
 * Uso (local, sobre cópia):
 *   node scripts/cleanup-operation-test-data.mjs /path/to/operation.db
 *
 * O que faz (idempotente onde possível):
 * 1) Unifica as 2 anamneses da consulta walk-in Renan Emigdio + Dra. Gabriela Lage
 *    em um único MedicalRecord, com nota administrativa transparente.
 * 2) Remove usuários/prestadores criados em testes (golive, persist, flush, etc.)
 *    e a massa efêmera associada (walk-ins de smoke/golive + cadeia gestão R$1).
 *
 * NÃO remove: Dra. Gabriela Lage, paciente Renan Emigdio, consulta, prescrição Dexilant,
 * nem contas canônicas do bootstrap CEDIG / Bibi.
 *
 * Após editar: republicar o arquivo em Netlify Blobs (store bibi-databases, key operation.db).
 */
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const dbPath = process.argv[2];
if (!dbPath || !existsSync(dbPath)) {
  console.error("Uso: node scripts/cleanup-operation-test-data.mjs <operation.db>");
  process.exit(1);
}

const KEEP_PROVIDER_EMAIL = "gabriela@cedig.demo";
const RENAN_PATIENT_ID = "cms1d645t0001l509a9n9g1lq";
const ANAMNESE_KEEP_ID = "cms1dfyj10007l709dspz2rcl";
const ANAMNESE_DROP_ID = "cms1do1bj0003l909hzdnlqbt";
const APPOINTMENT_ID = "cms1d64f50005l509leuxnvzt";
const CEDIG_TENANT_ID = "cms01euvn0002l709fy3dwzc9";
const ADMIN_ACTOR = "operacao@cedig.demo";

const TEST_USER_EMAILS = [
  "teste.admin@bibi.health",
  "novo.medico.1785002467@cedig.demo",
  "medico.1785002800@cedig.demo",
  "dr.persist.1785003451@cedig.demo",
  "dra.flush.1785003844@cedig.demo",
  "golive.1785004209@cedig.demo",
  "golive.1785004273@cedig.demo",
  "golive.1785004324@cedig.demo",
];

const TEST_PATIENT_NAMES = [
  "Walkin Operacao OK",
  "Cliente Apresentacao",
  "Golive Walkin",
  "Smoke Hotfix 3.0.2",
];

function cuidLike() {
  return `cln${Date.now().toString(36)}${randomBytes(6).toString("hex")}`;
}

function mergeAnamneseContent(part1, part2) {
  const a = String(part1 ?? "").trimEnd();
  const b = String(part2 ?? "").trim();
  const aNorm = a.replace(/\nExame físico:\s*$/u, "").trimEnd();
  const bNorm = b.replace(/^Exame físico:\s*/u, "Exame físico:\n").trim();
  const clinical = `${aNorm}\n\n${bNorm}`.trim();
  const note = [
    "",
    "---",
    `[Unificação administrativa 2026-07-26] Conteúdo clínico preservado integralmente a partir de 2 registros ANAMNESE criados por engano na mesma consulta (ids: ${ANAMNESE_KEEP_ID} + ${ANAMNESE_DROP_ID} → este registro). Prestadora: Dra. Gabriela Lage · Paciente: Renan Emigdio · Consulta: ${APPOINTMENT_ID}.`,
  ].join("\n");
  return `${clinical}\n${note}\n`;
}

const absoluteUrl = dbPath.startsWith("/") ? `file:${dbPath}` : `file:${process.cwd()}/${dbPath}`;
const prisma = new PrismaClient({ datasources: { db: { url: absoluteUrl } } });

const summary = {
  anamneseMerged: false,
  anamneseAlreadyMerged: false,
  usersRemoved: [],
  patientsRemoved: [],
  appointmentsRemoved: 0,
  launchesRemoved: 0,
  invoicesRemoved: 0,
  timelineEvents: 0,
};

try {
  await prisma.$transaction(async (tx) => {
    const keep = await tx.medicalRecord.findUnique({ where: { id: ANAMNESE_KEEP_ID } });
    const drop = await tx.medicalRecord.findUnique({ where: { id: ANAMNESE_DROP_ID } });

    if (keep && drop) {
      if (keep.patientId !== RENAN_PATIENT_ID || drop.patientId !== RENAN_PATIENT_ID) {
        throw new Error("Anamneses não pertencem ao paciente Renan — abortando.");
      }
      if (keep.appointmentId !== APPOINTMENT_ID || drop.appointmentId !== APPOINTMENT_ID) {
        throw new Error("Anamneses não pertencem à mesma consulta — abortando.");
      }

      const merged = mergeAnamneseContent(keep.content, drop.content);
      await tx.medicalRecord.update({
        where: { id: ANAMNESE_KEEP_ID },
        data: { content: merged, title: "Anamnese (consulta unificada)" },
      });
      await tx.medicalRecord.delete({ where: { id: ANAMNESE_DROP_ID } });

      await tx.timelineEvent.create({
        data: {
          id: cuidLike(),
          tenantId: CEDIG_TENANT_ID,
          entityType: "MedicalRecord",
          entityId: ANAMNESE_KEEP_ID,
          action: "MEDICAL_RECORD_MERGED",
          description:
            "Unificação administrativa: 2 anamneses da consulta de Renan Emigdio (Dra. Gabriela Lage) consolidadas em um único registro",
          metadata: JSON.stringify({
            keptId: ANAMNESE_KEEP_ID,
            droppedId: ANAMNESE_DROP_ID,
            appointmentId: APPOINTMENT_ID,
            patientId: RENAN_PATIENT_ID,
            providerEmail: KEEP_PROVIDER_EMAIL,
            reason: "duplicata por engano humano na mesma consulta",
            contentPreserved: true,
          }),
          correlationId: APPOINTMENT_ID,
          reversible: false,
          createdAt: new Date(),
          createdBy: ADMIN_ACTOR,
        },
      });
      summary.timelineEvents += 1;
      summary.anamneseMerged = true;
    } else if (keep && !drop) {
      summary.anamneseAlreadyMerged = keep.content.includes("Unificação administrativa 2026-07-26");
    } else if (!keep && !drop) {
      throw new Error("Anamneses não encontradas — base diferente da esperada?");
    } else {
      throw new Error("Estado inconsistente das anamneses (só um dos ids presente).");
    }

    const testUsers = await tx.user.findMany({
      where: { email: { in: TEST_USER_EMAILS } },
      select: { id: true, email: true, name: true },
    });
    const testUserIds = testUsers.map((u) => u.id);

    const testPatients = await tx.patient.findMany({
      where: {
        name: { in: TEST_PATIENT_NAMES },
        id: { not: RENAN_PATIENT_ID },
      },
      select: { id: true, name: true, cpf: true },
    });
    const testPatientIds = testPatients.map((p) => p.id);

    const launches = await tx.clinicExamLaunch.findMany({
      where: {
        OR: [
          { patientName: { startsWith: "Smoke" } },
          ...(testPatientIds.length ? [{ patientId: { in: testPatientIds } }] : []),
          ...(testUserIds.length ? [{ providerId: { in: testUserIds } }] : []),
        ],
      },
    });

    for (const launch of launches) {
      if (launch.invoiceId) {
        await tx.payment.deleteMany({ where: { invoiceId: launch.invoiceId } });
        await tx.invoiceItem.deleteMany({ where: { invoiceId: launch.invoiceId } });
        await tx.invoice.deleteMany({ where: { id: launch.invoiceId } });
        summary.invoicesRemoved += 1;
      }
      if (launch.usageId) {
        await tx.procedureUsage.deleteMany({ where: { id: launch.usageId } });
      }
      await tx.clinicExamLaunch.delete({ where: { id: launch.id } });
      summary.launchesRemoved += 1;
    }

    const appts = await tx.appointment.findMany({
      where: {
        OR: [
          ...(testPatientIds.length ? [{ patientId: { in: testPatientIds } }] : []),
          ...(testUserIds.length ? [{ providerId: { in: testUserIds } }] : []),
        ],
      },
      select: { id: true },
    });

    for (const appt of appts) {
      await tx.medicalRecord.deleteMany({ where: { appointmentId: appt.id } });
      await tx.medicationPrescription.deleteMany({ where: { appointmentId: appt.id } });
      await tx.examOrder.deleteMany({ where: { appointmentId: appt.id } });
      await tx.procedureUsage.deleteMany({ where: { appointmentId: appt.id } });
      await tx.appointment.delete({ where: { id: appt.id } });
      summary.appointmentsRemoved += 1;
    }

    for (const patient of testPatients) {
      await tx.patientClinicalProfile.deleteMany({ where: { patientId: patient.id } });
      await tx.medicalRecord.deleteMany({ where: { patientId: patient.id } });
      await tx.medicationPrescription.deleteMany({ where: { patientId: patient.id } });
      await tx.examOrder.deleteMany({ where: { patientId: patient.id } });
      await tx.user.updateMany({ where: { patientId: patient.id }, data: { patientId: null } });
      await tx.patient.delete({ where: { id: patient.id } });
    }
    summary.patientsRemoved = testPatients.map((p) => `${p.name} (${p.cpf})`);

    for (const user of testUsers) {
      await tx.clinicExamLaunch.deleteMany({
        where: { OR: [{ providerId: user.id }, { createdById: user.id }] },
      });
      await tx.user.delete({ where: { id: user.id } });
      summary.usersRemoved.push(`${user.name} <${user.email}>`);
    }

    await tx.timelineEvent.create({
      data: {
        id: cuidLike(),
        tenantId: CEDIG_TENANT_ID,
        entityType: "Tenant",
        entityId: CEDIG_TENANT_ID,
        action: "OPERATION_TEST_DATA_CLEANUP",
        description:
          "Limpeza de usuários e massa efêmera de testes no operation.db (mantidos Renan Emigdio + Dra. Gabriela Lage)",
        metadata: JSON.stringify({
          usersRemoved: summary.usersRemoved,
          patientsRemoved: summary.patientsRemoved,
          appointmentsRemoved: summary.appointmentsRemoved,
          launchesRemoved: summary.launchesRemoved,
          invoicesRemoved: summary.invoicesRemoved,
          anamneseMerged: summary.anamneseMerged,
          kept: {
            patient: "Renan Emigdio",
            provider: "Dra. Gabriela Lage <gabriela@cedig.demo>",
            anamneseId: ANAMNESE_KEEP_ID,
            appointmentId: APPOINTMENT_ID,
          },
        }),
        reversible: false,
        createdAt: new Date(),
        createdBy: ADMIN_ACTOR,
      },
    });
    summary.timelineEvents += 1;
  });

  console.log(JSON.stringify(summary, null, 2));
} finally {
  await prisma.$disconnect();
}
