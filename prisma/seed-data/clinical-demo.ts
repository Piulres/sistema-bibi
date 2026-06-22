import type { PrismaClient } from "@prisma/client";
import {
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "../../src/lib/timeline";

type ClinicalSeedInput = {
  tenantId: string;
  patientId: string;
  providerId: string;
  appointmentId: string;
  procedureHbA1cId?: string;
};

/** Massa demo Care Chart — João Pereira com perfil, meds, exame e protocolo HAS. */
export async function seedClinicalDemo(
  prisma: PrismaClient,
  input: ClinicalSeedInput,
): Promise<void> {
  await prisma.patientClinicalProfile.upsert({
    where: { patientId: input.patientId },
    create: {
      patientId: input.patientId,
      bloodType: "O+",
      allergies: JSON.stringify([
        { substance: "Dipirona", severity: "Moderada", notes: "Rash cutâneo" },
      ]),
      chronicConditions: JSON.stringify([
        { condition: "Hipertensão arterial", since: "2019" },
        { condition: "Diabetes tipo 2", since: "2021" },
      ]),
    },
    update: {},
  });

  const losartana = await prisma.medicationPrescription.create({
    data: {
      patientId: input.patientId,
      providerId: input.providerId,
      status: "ATIVA",
      medication: "Losartana 50mg",
      dosage: "1 comprimido",
      frequency: "1x ao dia (manhã)",
      route: "VO",
      durationDays: 90,
    },
  });

  const metformina = await prisma.medicationPrescription.create({
    data: {
      patientId: input.patientId,
      providerId: input.providerId,
      status: "ATIVA",
      medication: "Metformina 850mg",
      dosage: "1 comprimido",
      frequency: "2x ao dia",
      route: "VO",
      durationDays: 90,
    },
  });

  const hba1c = await prisma.examOrder.create({
    data: {
      patientId: input.patientId,
      providerId: input.providerId,
      appointmentId: input.appointmentId,
      procedureId: input.procedureHbA1cId ?? null,
      examName: "Hemoglobina glicada (HbA1c)",
      status: "SOLICITADO",
      clinicalIndication: "Acompanhamento diabetes — controle trimestral",
    },
  });

  const hasTemplate = await prisma.careProtocolTemplate.create({
    data: {
      tenantId: input.tenantId,
      name: "Acompanhamento HAS",
      specialty: "Cardiologia",
      suggestedReturnDays: 30,
      checklist: JSON.stringify([
        { id: "pa", label: "Medir pressão arterial", required: true },
        { id: "meds", label: "Revisar adesão medicamentosa", required: true },
        { id: "diet", label: "Orientar dieta hipossódica", required: false },
        { id: "exercise", label: "Prescrever atividade física", required: false },
      ]),
    },
  });

  await prisma.careProtocolTemplate.create({
    data: {
      tenantId: input.tenantId,
      name: "Acompanhamento DM2",
      specialty: "Endocrinologia",
      suggestedReturnDays: 90,
      checklist: JSON.stringify([
        { id: "hba1c", label: "Solicitar HbA1c", required: true },
        { id: "glicemia", label: "Avaliar glicemia de jejum", required: true },
        { id: "peso", label: "Registrar peso e IMC", required: true },
      ]),
    },
  });

  await prisma.careProtocolTemplate.create({
    data: {
      tenantId: input.tenantId,
      name: "Check-up anual",
      specialty: "Clínica geral",
      suggestedReturnDays: 365,
      checklist: JSON.stringify([
        { id: "labs", label: "Painel laboratorial básico", required: true },
        { id: "ecg", label: "Eletrocardiograma", required: false },
        { id: "vacinas", label: "Atualizar calendário vacinal", required: false },
      ]),
    },
  });

  const enrollment = await prisma.patientProtocolEnrollment.create({
    data: {
      patientId: input.patientId,
      templateId: hasTemplate.id,
      providerId: input.providerId,
      appointmentId: input.appointmentId,
      checklistState: JSON.stringify({ pa: true, meds: true }),
      nextReviewAt: new Date(Date.now() + 30 * 86_400_000),
    },
  });

  await prisma.timelineEvent.createMany({
    data: [
      {
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.MEDICATION_PRESCRIPTION,
        entityId: losartana.id,
        action: TIMELINE_ACTIONS.MEDICATION_PRESCRIBED,
        description: "Prescrição de Losartana 50mg para João Pereira",
        createdBy: input.providerId,
      },
      {
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.MEDICATION_PRESCRIPTION,
        entityId: metformina.id,
        action: TIMELINE_ACTIONS.MEDICATION_PRESCRIBED,
        description: "Prescrição de Metformina 850mg para João Pereira",
        createdBy: input.providerId,
      },
      {
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.EXAM_ORDER,
        entityId: hba1c.id,
        action: TIMELINE_ACTIONS.EXAM_ORDERED,
        description: "Exame HbA1c solicitado para João Pereira",
        createdBy: input.providerId,
      },
      {
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.CARE_PROTOCOL,
        entityId: enrollment.id,
        action: TIMELINE_ACTIONS.PROTOCOL_STARTED,
        description: "Protocolo Acompanhamento HAS iniciado para João Pereira",
        createdBy: input.providerId,
      },
    ],
  });
}
