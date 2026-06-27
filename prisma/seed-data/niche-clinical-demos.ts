import type { PrismaClient } from "@prisma/client";
import type { NicheId } from "../../src/lib/niche/types";
import {
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "../../src/lib/timeline";

type ClinicalCtx = {
  tenantId: string;
  patientId: string;
  providerId: string;
  appointmentId?: string;
};

/** Perfil clínico / dossiê rico por segmento — espelha Care Chart do Horizonte. */
export async function seedNicheClinicalDemo(
  prisma: PrismaClient,
  niche: NicheId,
  ctx: ClinicalCtx,
): Promise<void> {
  switch (niche) {
    case "DENTAL":
      await seedDentalClinical(prisma, ctx);
      break;
    case "LEGAL":
      await seedLegalDossier(prisma, ctx);
      break;
    case "SPA":
      await seedSpaWellnessProfile(prisma, ctx);
      break;
    case "EDUCATION":
      await seedEducationProgress(prisma, ctx);
      break;
    default:
      break;
  }
}

async function seedDentalClinical(prisma: PrismaClient, ctx: ClinicalCtx): Promise<void> {
  await prisma.patientClinicalProfile.upsert({
    where: { patientId: ctx.patientId },
    create: {
      patientId: ctx.patientId,
      bloodType: "A+",
      allergies: JSON.stringify([{ substance: "Látex", severity: "Leve" }]),
      chronicConditions: JSON.stringify([
        { condition: "Bruxismo noturno", since: "2022" },
        { condition: "Gengivite leve", since: "2024" },
      ]),
    },
    update: {},
  });

  const record = await prisma.medicalRecord.create({
    data: {
      recordType: "EVOLUCAO",
      title: "Odontograma — avaliação inicial",
      content:
        "Arcada superior: restauração em 16, ausência 26. Arcada inferior: limpeza indicada.\n" +
        "Plano: profilaxia + restauração 16. Retorno em 15 dias.",
      patientId: ctx.patientId,
      providerId: ctx.providerId,
      appointmentId: ctx.appointmentId ?? null,
    },
  });

  const rx = await prisma.examOrder.create({
    data: {
      patientId: ctx.patientId,
      providerId: ctx.providerId,
      appointmentId: ctx.appointmentId ?? null,
      examName: "Radiografia periapical — elemento 16",
      status: "SOLICITADO",
      clinicalIndication: "Avaliação pré-restauração",
    },
  });

  const template = await prisma.careProtocolTemplate.create({
    data: {
      tenantId: ctx.tenantId,
      name: "Manutenção ortodôntica trimestral",
      specialty: "Ortodontia",
      suggestedReturnDays: 90,
      checklist: JSON.stringify([
        { id: "aparelho", label: "Verificar aparelho fixo", required: true },
        { id: "higiene", label: "Orientar higiene interdental", required: true },
        { id: "elastico", label: "Revisar uso de elásticos", required: false },
      ]),
    },
  });

  await prisma.patientProtocolEnrollment.create({
    data: {
      patientId: ctx.patientId,
      templateId: template.id,
      providerId: ctx.providerId,
      appointmentId: ctx.appointmentId ?? null,
      checklistState: JSON.stringify({ aparelho: true }),
      nextReviewAt: new Date(Date.now() + 90 * 86_400_000),
    },
  });

  await prisma.timelineEvent.createMany({
    data: [
      {
        tenantId: ctx.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.MEDICAL_RECORD,
        entityId: record.id,
        action: TIMELINE_ACTIONS.MEDICAL_RECORD_CREATED,
        description: "Odontograma registrado no prontuário",
        createdBy: ctx.providerId,
      },
      {
        tenantId: ctx.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.EXAM_ORDER,
        entityId: rx.id,
        action: TIMELINE_ACTIONS.EXAM_ORDERED,
        description: "Radiografia periapical solicitada",
        createdBy: ctx.providerId,
      },
    ],
  });
}

async function seedLegalDossier(prisma: PrismaClient, ctx: ClinicalCtx): Promise<void> {
  await prisma.patientClinicalProfile.upsert({
    where: { patientId: ctx.patientId },
    create: {
      patientId: ctx.patientId,
      chronicConditions: JSON.stringify([
        { condition: "Processo trabalhista em andamento", since: "2025" },
      ]),
      allergies: JSON.stringify([]),
    },
    update: {},
  });

  const dossier = await prisma.medicalRecord.create({
    data: {
      recordType: "EVOLUCAO",
      title: "Dossiê — consulta trabalhista inicial",
      content:
        "Cliente relatou rescisão sem justa causa. Documentos: CTPS, TRCT, extrato FGTS.\n" +
        "Prazo prescricional: 2 anos. Estratégia: notificação extrajudicial + acordo.",
      patientId: ctx.patientId,
      providerId: ctx.providerId,
      appointmentId: ctx.appointmentId ?? null,
    },
  });

  const parecer = await prisma.medicalRecord.create({
    data: {
      recordType: "EVOLUCAO",
      title: "Parecer — compliance LGPD",
      content:
        "Mapeamento de bases legais concluído. Riscos: tratamento de dados de colaboradores sem DPO.\n" +
        "Recomendação: política de privacidade + RIPD simplificado.",
      patientId: ctx.patientId,
      providerId: ctx.providerId,
    },
  });

  const template = await prisma.careProtocolTemplate.create({
    data: {
      tenantId: ctx.tenantId,
      name: "Assessoria jurídica mensal",
      specialty: "Empresarial",
      suggestedReturnDays: 30,
      checklist: JSON.stringify([
        { id: "publicacoes", label: "Monitorar publicações", required: true },
        { id: "prazos", label: "Atualizar agenda de prazos", required: true },
        { id: "cliente", label: "Relatório mensal ao cliente", required: true },
      ]),
    },
  });

  await prisma.patientProtocolEnrollment.create({
    data: {
      patientId: ctx.patientId,
      templateId: template.id,
      providerId: ctx.providerId,
      checklistState: JSON.stringify({ publicacoes: true, prazos: true }),
      nextReviewAt: new Date(Date.now() + 30 * 86_400_000),
    },
  });

  await prisma.timelineEvent.createMany({
    data: [
      {
        tenantId: ctx.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.MEDICAL_RECORD,
        entityId: dossier.id,
        action: TIMELINE_ACTIONS.MEDICAL_RECORD_CREATED,
        description: "Dossiê jurídico aberto",
        createdBy: ctx.providerId,
      },
      {
        tenantId: ctx.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.MEDICAL_RECORD,
        entityId: parecer.id,
        action: TIMELINE_ACTIONS.MEDICAL_RECORD_CREATED,
        description: "Parecer LGPD emitido",
        createdBy: ctx.providerId,
      },
    ],
  });
}

async function seedSpaWellnessProfile(prisma: PrismaClient, ctx: ClinicalCtx): Promise<void> {
  await prisma.patientClinicalProfile.upsert({
    where: { patientId: ctx.patientId },
    create: {
      patientId: ctx.patientId,
      allergies: JSON.stringify([{ substance: "Óleos cítricos", severity: "Moderada" }]),
      chronicConditions: JSON.stringify([
        { condition: "Lombalgia crônica leve", since: "2023" },
      ]),
    },
    update: {},
  });

  const session = await prisma.medicalRecord.create({
    data: {
      recordType: "EVOLUCAO",
      title: "Ficha wellness — anamnese inicial",
      content:
        "Contraindicações: gravidez (N/A). Pressão arterial normal.\n" +
        "Preferência: massagem relaxante 60min. Pacote Day Spa — 3/5 sessões utilizadas.",
      patientId: ctx.patientId,
      providerId: ctx.providerId,
      appointmentId: ctx.appointmentId ?? null,
    },
  });

  const template = await prisma.careProtocolTemplate.create({
    data: {
      tenantId: ctx.tenantId,
      name: "Programa corporativo wellness 8 semanas",
      specialty: "Bem-estar",
      suggestedReturnDays: 7,
      checklist: JSON.stringify([
        { id: "sessao", label: "Registrar sessão e terapeuta", required: true },
        { id: "feedback", label: "Coletar NPS pós-sessão", required: true },
        { id: "pacote", label: "Debitar crédito do pacote", required: true },
      ]),
    },
  });

  await prisma.patientProtocolEnrollment.create({
    data: {
      patientId: ctx.patientId,
      templateId: template.id,
      providerId: ctx.providerId,
      appointmentId: ctx.appointmentId ?? null,
      checklistState: JSON.stringify({ sessao: true, pacote: true }),
      nextReviewAt: new Date(Date.now() + 7 * 86_400_000),
    },
  });

  await prisma.timelineEvent.create({
    data: {
      tenantId: ctx.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.MEDICAL_RECORD,
      entityId: session.id,
      action: TIMELINE_ACTIONS.MEDICAL_RECORD_CREATED,
      description: "Ficha wellness registrada",
      createdBy: ctx.providerId,
    },
  });
}

async function seedEducationProgress(prisma: PrismaClient, ctx: ClinicalCtx): Promise<void> {
  await prisma.patientClinicalProfile.upsert({
    where: { patientId: ctx.patientId },
    create: {
      patientId: ctx.patientId,
      chronicConditions: JSON.stringify([]),
      allergies: JSON.stringify([]),
    },
    update: {},
  });

  const plan = await prisma.medicalRecord.create({
    data: {
      recordType: "EVOLUCAO",
      title: "Plano pedagógico — nivelamento matemática",
      content:
        "Nível atual: equações 1º grau (domínio parcial). Meta: 2º grau em 8 semanas.\n" +
        "Carga: 2 aulas/semana + lista semanal. Próxima avaliação: simulado ENEM parcial.",
      patientId: ctx.patientId,
      providerId: ctx.providerId,
      appointmentId: ctx.appointmentId ?? null,
    },
  });

  const template = await prisma.careProtocolTemplate.create({
    data: {
      tenantId: ctx.tenantId,
      name: "Trilha certificação — 12 semanas",
      specialty: "Capacitação",
      suggestedReturnDays: 7,
      checklist: JSON.stringify([
        { id: "presenca", label: "Registrar presença", required: true },
        { id: "conteudo", label: "Registrar conteúdo ministrado", required: true },
        { id: "tarefa", label: "Enviar tarefa de casa", required: false },
        { id: "progresso", label: "Atualizar % da trilha", required: true },
      ]),
    },
  });

  await prisma.patientProtocolEnrollment.create({
    data: {
      patientId: ctx.patientId,
      templateId: template.id,
      providerId: ctx.providerId,
      appointmentId: ctx.appointmentId ?? null,
      checklistState: JSON.stringify({ presenca: true, progresso: true }),
      nextReviewAt: new Date(Date.now() + 7 * 86_400_000),
    },
  });

  await prisma.examOrder.create({
    data: {
      patientId: ctx.patientId,
      providerId: ctx.providerId,
      appointmentId: ctx.appointmentId ?? null,
      examName: "Simulado diagnóstico — matemática",
      status: "SOLICITADO",
      clinicalIndication: "Nivelamento inicial da trilha corporativa",
    },
  });

  await prisma.timelineEvent.create({
    data: {
      tenantId: ctx.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.MEDICAL_RECORD,
      entityId: plan.id,
      action: TIMELINE_ACTIONS.MEDICAL_RECORD_CREATED,
      description: "Plano pedagógico registrado",
      createdBy: ctx.providerId,
    },
  });
}
