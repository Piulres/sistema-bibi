import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../src/lib/password";
import {
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "../../src/lib/timeline";

const DEMO_PASSWORD = hashPassword("bibi123");

/** Equipe auxiliar demo — anestesista + técnico de enfermagem. */
export const SEED_TEAM_STAFF = [
  {
    email: "dr.anestesia@bibi.health",
    name: "Dr. Carlos Anestesia",
    role: "PRESTADOR" as const,
    specialty: "Anestesiologia",
    councilType: "CRM",
    councilNumber: "567890",
    councilUf: "SP",
  },
  {
    email: "enf.renata@bibi.health",
    name: "Renata Souza",
    role: "INTERNO" as const,
    internoProfile: "RECEPCAO" as const,
    specialty: "Técnica de enfermagem",
    councilType: "COREN",
    councilNumber: "112233",
    councilUf: "SP",
  },
] as const;

export type TeamStaffIds = {
  anesthetistId: string;
  nursingTechId: string;
};

/** Garante usuários de equipe no tenant (idempotente por e-mail). */
export async function ensureTeamStaffUsers(
  prisma: PrismaClient,
  tenantId: string,
): Promise<TeamStaffIds> {
  const created: Record<string, string> = {};

  for (const staff of SEED_TEAM_STAFF) {
    const existing = await prisma.user.findUnique({ where: { email: staff.email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { tenantId, specialty: staff.specialty },
      });
      created[staff.email] = existing.id;
      continue;
    }
    const user = await prisma.user.create({
      data: {
        email: staff.email,
        name: staff.name,
        password: DEMO_PASSWORD,
        role: staff.role,
        internoProfile: "internoProfile" in staff ? staff.internoProfile : null,
        specialty: staff.specialty,
        councilType: staff.councilType ?? null,
        councilNumber: staff.councilNumber ?? null,
        councilUf: staff.councilUf ?? null,
        tenantId,
      },
    });
    created[staff.email] = user.id;
  }

  return {
    anesthetistId: created["dr.anestesia@bibi.health"],
    nursingTechId: created["enf.renata@bibi.health"],
  };
}

type ProcedurePriceRef = { id: string; price: number; name?: string };

export type AppointmentTeamMassInput = {
  tenantId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  anesthetistId: string;
  nursingTechId: string;
  procedures: {
    consulta?: ProcedurePriceRef;
    exame?: ProcedurePriceRef;
    anestFee?: ProcedurePriceRef;
    enfFee?: ProcedurePriceRef;
  };
  /** Incluir receita multi-item pré-procedimento (colonoscopia). */
  withPrescriptionDocument?: boolean;
};

/**
 * Massa demo: consulta + exame + equipe (anestesista + enfermagem) + receita multi-item.
 * Espelha o fluxo gastro → colonoscopia com custos em camadas.
 */
export async function seedAppointmentTeamMass(
  prisma: PrismaClient,
  input: AppointmentTeamMassInput,
): Promise<void> {
  const { procedures } = input;

  if (procedures.consulta) {
    const usage = await prisma.procedureUsage.create({
      data: {
        appointmentId: input.appointmentId,
        procedureId: procedures.consulta.id,
        priceCharged: procedures.consulta.price,
      },
    });
    await prisma.timelineEvent.create({
      data: {
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE,
        entityId: usage.id,
        action: TIMELINE_ACTIONS.PROCEDURE_REGISTERED,
        description: `Consulta registrada — ${input.patientName} (R$ ${procedures.consulta.price.toFixed(2)})`,
        createdBy: input.providerId,
      },
    });
  }

  if (procedures.exame) {
    const usage = await prisma.procedureUsage.create({
      data: {
        appointmentId: input.appointmentId,
        procedureId: procedures.exame.id,
        priceCharged: procedures.exame.price,
      },
    });
    await prisma.timelineEvent.create({
      data: {
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE,
        entityId: usage.id,
        action: TIMELINE_ACTIONS.PROCEDURE_REGISTERED,
        description: `Exame registrado — ${input.patientName} (R$ ${procedures.exame.price.toFixed(2)})`,
        createdBy: input.providerId,
      },
    });
  }

  if (procedures.anestFee) {
    const usage = await prisma.procedureUsage.create({
      data: {
        appointmentId: input.appointmentId,
        procedureId: procedures.anestFee.id,
        priceCharged: procedures.anestFee.price,
      },
    });
    await prisma.appointmentParticipant.create({
      data: {
        appointmentId: input.appointmentId,
        userId: input.anesthetistId,
        role: "ANESTESISTA",
        notes: "Anestesia para procedimento endoscópico",
        procedureUsageId: usage.id,
      },
    });
  } else {
    await prisma.appointmentParticipant.create({
      data: {
        appointmentId: input.appointmentId,
        userId: input.anesthetistId,
        role: "ANESTESISTA",
        notes: "Anestesia para procedimento endoscópico",
      },
    });
  }

  if (procedures.enfFee) {
    const usage = await prisma.procedureUsage.create({
      data: {
        appointmentId: input.appointmentId,
        procedureId: procedures.enfFee.id,
        priceCharged: procedures.enfFee.price,
      },
    });
    await prisma.appointmentParticipant.create({
      data: {
        appointmentId: input.appointmentId,
        userId: input.nursingTechId,
        role: "TECNICO_ENFERMAGEM",
        notes: "Apoio durante o exame",
        procedureUsageId: usage.id,
      },
    });
  } else {
    await prisma.appointmentParticipant.create({
      data: {
        appointmentId: input.appointmentId,
        userId: input.nursingTechId,
        role: "TECNICO_ENFERMAGEM",
        notes: "Apoio durante o exame",
      },
    });
  }

  if (input.withPrescriptionDocument !== false) {
    const doc = await prisma.prescriptionDocument.create({
      data: {
        patientId: input.patientId,
        providerId: input.providerId,
        appointmentId: input.appointmentId,
        prescriptionKind: "COMUM",
        title: "Preparo intestinal — colonoscopia",
        notes: "Jejum absoluto 8h antes do exame. Suspender ferro 7 dias antes.",
        items: {
          create: [
            {
              sortOrder: 0,
              medication: "Polietilenoglicol (PEG) 238g",
              dosage: "1 sachê diluído em 2L de água",
              frequency: "Tomar metade na véspera e metade no dia do exame",
              route: "VO",
              durationDays: 2,
              quantity: "4 sachês",
            },
            {
              sortOrder: 1,
              medication: "Buscopan 10mg",
              dosage: "1 comprimido",
              frequency: "8/8h se cólica",
              route: "VO",
              durationDays: 2,
              quantity: "6 comprimidos",
            },
          ],
        },
      },
      include: { items: true },
    });

    for (const item of doc.items) {
      await prisma.medicationPrescription.create({
        data: {
          patientId: input.patientId,
          providerId: input.providerId,
          appointmentId: input.appointmentId,
          prescriptionKind: "COMUM",
          medication: item.medication,
          dosage: item.dosage,
          frequency: item.frequency,
          route: item.route,
          durationDays: item.durationDays,
          quantity: item.quantity,
          notes: item.notes,
          endDate:
            item.durationDays && item.durationDays > 0
              ? new Date(Date.now() + item.durationDays * 86_400_000)
              : null,
        },
      });
    }

    await prisma.timelineEvent.create({
      data: {
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.MEDICATION_PRESCRIPTION,
        entityId: doc.id,
        action: TIMELINE_ACTIONS.MEDICATION_PRESCRIBED,
        description: `Receita multi-item (preparo colonoscopia) — ${input.patientName}`,
        createdBy: input.providerId,
      },
    });
  }

  const existingReferral = await prisma.clinicalReferral.findFirst({
    where: { appointmentId: input.appointmentId },
  });
  if (!existingReferral) {
    const referral = await prisma.clinicalReferral.create({
      data: {
        patientId: input.patientId,
        providerId: input.providerId,
        appointmentId: input.appointmentId,
        referralKind: "ESPECIALIDADE",
        specialty: "Coloproctologia",
        urgency: "ROTINA",
        clinicalReason:
          "Avaliação coloproctológica após indicação de colonoscopia e preparo intestinal.",
        historySummary: "Queixa digestiva com indicação de investigação endoscópica.",
        requestedActions:
          "Revisar laudo da colonoscopia, definir seguimento e condutas complementares.",
      },
    });

    await prisma.timelineEvent.create({
      data: {
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.CLINICAL_REFERRAL,
        entityId: referral.id,
        action: TIMELINE_ACTIONS.REFERRAL_CREATED,
        description: `Encaminhamento para Coloproctologia — ${input.patientName}`,
        createdBy: input.providerId,
      },
    });
  }

  await prisma.timelineEvent.create({
    data: {
      tenantId: input.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.APPOINTMENT,
      entityId: input.appointmentId,
      action: TIMELINE_ACTIONS.UPDATED,
      description: `Equipe vinculada ao atendimento — ${input.patientName}`,
      createdBy: input.providerId,
    },
  });
}

/** Receita multi-item genérica (sem equipe) — complementa Care Chart. */
export async function seedPrescriptionDocumentDemo(
  prisma: PrismaClient,
  input: {
    tenantId: string;
    patientId: string;
    providerId: string;
    appointmentId: string;
    patientName: string;
  },
): Promise<void> {
  const existing = await prisma.prescriptionDocument.findFirst({
    where: { appointmentId: input.appointmentId },
  });
  if (existing) return;

  const doc = await prisma.prescriptionDocument.create({
    data: {
      patientId: input.patientId,
      providerId: input.providerId,
      appointmentId: input.appointmentId,
      prescriptionKind: "COMUM",
      title: "Receituário — controle pressórico e glicêmico",
      items: {
        create: [
          {
            sortOrder: 0,
            medication: "Losartana 50mg",
            dosage: "1 comprimido",
            frequency: "1x ao dia (manhã)",
            route: "VO",
            durationDays: 90,
            quantity: "90 comprimidos",
          },
          {
            sortOrder: 1,
            medication: "Metformina 850mg",
            dosage: "1 comprimido",
            frequency: "2x ao dia após refeições",
            route: "VO",
            durationDays: 90,
            quantity: "180 comprimidos",
          },
          {
            sortOrder: 2,
            medication: "AAS 100mg",
            dosage: "1 comprimido",
            frequency: "1x ao dia após almoço",
            route: "VO",
            durationDays: 90,
          },
        ],
      },
    },
  });

  await prisma.timelineEvent.create({
    data: {
      tenantId: input.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.MEDICATION_PRESCRIPTION,
      entityId: doc.id,
      action: TIMELINE_ACTIONS.MEDICATION_PRESCRIBED,
      description: `Receita multi-item (3 medicamentos) — ${input.patientName}`,
      createdBy: input.providerId,
    },
  });
}
