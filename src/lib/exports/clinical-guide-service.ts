import "server-only";
import { formatDateTimeBR as dateTime } from "@/lib/timezone";
import { getPrisma } from "@/lib/db";
import { getTenantBranding } from "@/lib/theme/branding";
import { getTenantLabelsById } from "@/lib/niche/tenant-labels";
import {
  buildClinicalGuidePdfBuffer,
  type ClinicalGuideContext,
  type ClinicalGuideClinic,
  type ClinicalGuidePatient,
  type ClinicalGuideProvider,
} from "@/lib/exports/clinical-guide-pdf";
import { clinicalGuideFilenameBase } from "@/lib/exports/clinical-guide-filename";
import { prescriptionKindLabel } from "@/lib/clinical/receita";
import {
  referralKindLabel,
  referralUrgencyLabel,
} from "@/lib/clinical/encaminhamento";

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

type PartyBundle = {
  clinic: ClinicalGuideClinic;
  patient: ClinicalGuidePatient;
  provider: ClinicalGuideProvider;
};

async function loadPartyBundle(
  tenantId: string,
  patientId: string,
  providerId: string,
): Promise<PartyBundle | null> {
  const prisma = await getPrisma();
  const [branding, labels, patient, provider] = await Promise.all([
    getTenantBranding(tenantId),
    getTenantLabelsById(tenantId),
    prisma.patient.findFirst({
      where: { id: patientId, tenantId },
      include: { company: { select: { name: true } } },
    }),
    prisma.user.findFirst({
      where: { id: providerId, tenantId },
      select: {
        name: true,
        councilType: true,
        councilNumber: true,
        councilUf: true,
        specialty: true,
      },
    }),
  ]);

  if (!patient || !provider) return null;

  return {
    clinic: {
      displayName: branding.displayName,
      tagline: branding.tagline,
      platformLabel: branding.platformLabel,
      primaryColor: branding.primaryColor,
    },
    patient: {
      name: patient.name,
      cpf: patient.cpf,
      birthDateLabel: dateOnly(patient.birthDate),
      phone: patient.phone,
      companyName: patient.company?.name ?? null,
      roleLabel: labels.patient,
    },
    provider: {
      name: provider.name,
      councilType: provider.councilType,
      councilNumber: provider.councilNumber,
      councilUf: provider.councilUf,
      specialty: provider.specialty,
    },
  };
}

function prescriptionContext(
  parties: PartyBundle,
  rx: {
    prescriptionKind: string;
    title: string | null;
    notes: string | null;
    createdAt: Date;
    appointment: { scheduledAt: Date } | null;
    items: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      route: string | null;
      durationDays: number | null;
      quantity: string | null;
      notes: string | null;
    }>;
  },
): ClinicalGuideContext {
  const kindLabel = prescriptionKindLabel(rx.prescriptionKind);
  const itemLines = rx.items
    .map((item, index) => {
      const parts = [
        `${index + 1}. ${item.medication}`,
        `   Dose: ${item.dosage} · ${item.frequency}${item.route ? ` · Via ${item.route}` : ""}`,
      ];
      if (item.durationDays) parts.push(`   Duração: ${item.durationDays} dia(s)`);
      if (item.quantity) parts.push(`   Quantidade: ${item.quantity}`);
      if (item.notes) parts.push(`   Obs.: ${item.notes}`);
      return parts.join("\n");
    })
    .join("\n\n");
  const isControlled = rx.prescriptionKind === "CONTROLE_ESPECIAL";

  return {
    ...parties,
    page: {
      docTypeLabel: kindLabel,
      title: rx.title?.trim() || kindLabel,
      subtitle: isControlled
        ? "Receita de Controle Especial — Portaria SVS/MS 344/1998 / RDC 1000/2025 · 1ª VIA — Retenção da farmácia"
        : "Receituário simples",
      issuedAtLabel: dateTime(rx.createdAt),
      appointmentDateLabel: rx.appointment
        ? dateTime(rx.appointment.scheduledAt)
        : null,
      sections: [
        { heading: "Prescrição", body: itemLines || "—" },
        ...(rx.notes ? [{ heading: "Observações", body: rx.notes }] : []),
      ],
      footerNote: isControlled
        ? "1ª via — retenção da farmácia · 2ª via — orientação ao paciente. Validade típica: 30 dias."
        : null,
      duplicateViaLabel: isControlled ? "2ª VIA — Orientação ao paciente" : null,
    },
  };
}

function referralContext(
  parties: PartyBundle,
  referral: {
    specialty: string;
    referralKind: string;
    urgency: string;
    clinicalReason: string;
    historySummary: string | null;
    requestedActions: string | null;
    createdAt: Date;
    appointment: { scheduledAt: Date } | null;
  },
): ClinicalGuideContext {
  const sections = [
    {
      heading: "Destino",
      body: `${referral.specialty}\nTipo: ${referralKindLabel(referral.referralKind)}\nUrgência: ${referralUrgencyLabel(referral.urgency)}`,
    },
    { heading: "Motivo clínico", body: referral.clinicalReason },
  ];
  if (referral.historySummary) {
    sections.push({ heading: "Histórico relevante", body: referral.historySummary });
  }
  if (referral.requestedActions) {
    sections.push({
      heading: "Condutas / exames solicitados ao especialista",
      body: referral.requestedActions,
    });
  }

  return {
    ...parties,
    page: {
      docTypeLabel: "Encaminhamento clínico",
      title: `Encaminhamento — ${referral.specialty}`,
      subtitle: `${referralUrgencyLabel(referral.urgency)} · ${referralKindLabel(referral.referralKind)}`,
      issuedAtLabel: dateTime(referral.createdAt),
      appointmentDateLabel: referral.appointment
        ? dateTime(referral.appointment.scheduledAt)
        : null,
      sections,
      footerNote: "Apresentar esta guia no serviço / especialidade de destino.",
    },
  };
}

export async function buildPrescriptionGuidePdf(
  tenantId: string,
  documentId: string,
  options?: { patientId?: string; providerId?: string },
): Promise<{ buffer: Buffer; patientName: string; issuedAt: Date } | null> {
  const prisma = await getPrisma();
  const doc = await prisma.prescriptionDocument.findFirst({
    where: {
      id: documentId,
      patient: { tenantId },
      ...(options?.patientId ? { patientId: options.patientId } : {}),
      ...(options?.providerId ? { providerId: options.providerId } : {}),
    },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      appointment: { select: { scheduledAt: true } },
      patient: { select: { id: true, name: true } },
      provider: { select: { id: true } },
    },
  });
  if (!doc) return null;

  const parties = await loadPartyBundle(tenantId, doc.patient.id, doc.provider.id);
  if (!parties) return null;

  const buffer = await buildClinicalGuidePdfBuffer([
    prescriptionContext(parties, doc),
  ]);
  return { buffer, patientName: doc.patient.name, issuedAt: doc.createdAt };
}

export async function buildExamRequestGuidePdf(
  tenantId: string,
  options: {
    appointmentId?: string;
    examOrderId?: string;
    patientId?: string;
    providerId?: string;
  },
): Promise<{ buffer: Buffer; patientName: string; issuedAt: Date } | null> {
  const prisma = await getPrisma();

  const orders = await prisma.examOrder.findMany({
    where: {
      patient: { tenantId },
      status: { not: "CANCELADO" },
      ...(options.appointmentId ? { appointmentId: options.appointmentId } : {}),
      ...(options.examOrderId && !options.appointmentId ? { id: options.examOrderId } : {}),
      ...(options.patientId ? { patientId: options.patientId } : {}),
      ...(options.providerId ? { providerId: options.providerId } : {}),
    },
    include: {
      appointment: { select: { scheduledAt: true } },
      patient: { select: { id: true, name: true } },
      provider: { select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (orders.length === 0) return null;

  const head = orders[0];
  const parties = await loadPartyBundle(tenantId, head.patient.id, head.provider.id);
  if (!parties) return null;

  const body = orders
    .map((order, index) => {
      const lines = [`${index + 1}. ${order.examName}`];
      if (order.clinicalIndication) lines.push(`   Indicação: ${order.clinicalIndication}`);
      return lines.join("\n");
    })
    .join("\n\n");

  const indications = [
    ...new Set(orders.map((o) => o.clinicalIndication).filter(Boolean)),
  ] as string[];

  const ctx: ClinicalGuideContext = {
    ...parties,
    page: {
      docTypeLabel: "Pedido de exames",
      title:
        orders.length === 1
          ? `Solicitação — ${head.examName}`
          : `Solicitação de ${orders.length} exames`,
      subtitle: "Levar esta guia ao laboratório / serviço de imagem",
      issuedAtLabel: dateTime(head.createdAt),
      appointmentDateLabel: head.appointment
        ? dateTime(head.appointment.scheduledAt)
        : null,
      sections: [
        { heading: "Exames solicitados", body },
        ...(indications.length > 0
          ? [{ heading: "Indicação clínica", body: indications.join("\n") }]
          : []),
      ],
      footerNote:
        "Documento assistencial. Confirmar preparo e cobertura com a unidade realizadora.",
    },
  };

  const buffer = await buildClinicalGuidePdfBuffer([ctx]);
  return { buffer, patientName: head.patient.name, issuedAt: head.createdAt };
}

export async function buildReferralGuidePdf(
  tenantId: string,
  referralId: string,
  options?: { patientId?: string; providerId?: string },
): Promise<{ buffer: Buffer; patientName: string; issuedAt: Date } | null> {
  const prisma = await getPrisma();
  const referral = await prisma.clinicalReferral.findFirst({
    where: {
      id: referralId,
      patient: { tenantId },
      ...(options?.patientId ? { patientId: options.patientId } : {}),
      ...(options?.providerId ? { providerId: options.providerId } : {}),
    },
    include: {
      appointment: { select: { scheduledAt: true } },
      patient: { select: { id: true, name: true } },
      provider: { select: { id: true } },
    },
  });
  if (!referral) return null;

  const parties = await loadPartyBundle(tenantId, referral.patient.id, referral.provider.id);
  if (!parties) return null;

  const buffer = await buildClinicalGuidePdfBuffer([
    referralContext(parties, referral),
  ]);
  return {
    buffer,
    patientName: referral.patient.name,
    issuedAt: referral.createdAt,
  };
}

/** Atestado no mesmo layout tipográfico das demais guias (não PEP genérico). */
export async function buildAtestadoGuidePdf(
  tenantId: string,
  recordId: string,
  options?: { patientId?: string; providerId?: string },
): Promise<{ buffer: Buffer; patientName: string; issuedAt: Date } | null> {
  const prisma = await getPrisma();
  const record = await prisma.medicalRecord.findFirst({
    where: {
      id: recordId,
      recordType: "ATESTADO",
      patient: { tenantId },
      ...(options?.patientId ? { patientId: options.patientId } : {}),
      ...(options?.providerId ? { providerId: options.providerId } : {}),
    },
    include: {
      appointment: { select: { scheduledAt: true } },
      patient: { select: { id: true, name: true } },
      provider: { select: { id: true } },
    },
  });
  if (!record) return null;

  const parties = await loadPartyBundle(tenantId, record.patient.id, record.provider.id);
  if (!parties) return null;

  const ctx: ClinicalGuideContext = {
    ...parties,
    page: {
      docTypeLabel: "Atestado médico",
      title: record.title?.trim() || "Atestado médico",
      subtitle: "Resolução CFM nº 2.381/2024 — documento assistencial",
      issuedAtLabel: dateTime(record.createdAt),
      appointmentDateLabel: record.appointment
        ? dateTime(record.appointment.scheduledAt)
        : null,
      sections: [{ heading: "Texto do atestado", body: record.content }],
      footerNote:
        "Em produção nacional, preferir emissão via Atesta CFM ou sistema integrado (Res. CFM 2.382/2024).",
    },
  };

  const buffer = await buildClinicalGuidePdfBuffer([ctx]);
  return {
    buffer,
    patientName: record.patient.name,
    issuedAt: record.createdAt,
  };
}

export type ClinicalGuideExportType =
  | "receita"
  | "exame"
  | "encaminhamento"
  | "atestado"
  | "bundle";

/** Resolve PDF por tipo de guia clínica. */
export async function buildClinicalGuideExport(input: {
  tenantId: string;
  type: ClinicalGuideExportType;
  id?: string | null;
  appointmentId?: string | null;
  patientId?: string | null;
  providerId?: string | null;
}): Promise<{ buffer: Buffer; filenameBase: string } | null> {
  const scope = {
    patientId: input.patientId ?? undefined,
    providerId: input.providerId ?? undefined,
  };

  if (input.type === "receita") {
    if (!input.id) return null;
    const result = await buildPrescriptionGuidePdf(input.tenantId, input.id, scope);
    if (!result) return null;
    return {
      buffer: result.buffer,
      filenameBase: clinicalGuideFilenameBase(
        "receita",
        result.patientName,
        result.issuedAt,
      ),
    };
  }

  if (input.type === "exame") {
    const appointmentId = input.appointmentId ?? undefined;
    const examOrderId = !appointmentId ? input.id ?? undefined : undefined;
    const result = await buildExamRequestGuidePdf(input.tenantId, {
      appointmentId,
      examOrderId,
      ...scope,
    });
    if (!result) return null;
    return {
      buffer: result.buffer,
      filenameBase: clinicalGuideFilenameBase(
        "pedido-exames",
        result.patientName,
        result.issuedAt,
      ),
    };
  }

  if (input.type === "encaminhamento") {
    if (!input.id) return null;
    const result = await buildReferralGuidePdf(input.tenantId, input.id, scope);
    if (!result) return null;
    return {
      buffer: result.buffer,
      filenameBase: clinicalGuideFilenameBase(
        "encaminhamento",
        result.patientName,
        result.issuedAt,
      ),
    };
  }

  if (input.type === "atestado") {
    if (!input.id) return null;
    const result = await buildAtestadoGuidePdf(input.tenantId, input.id, scope);
    if (!result) return null;
    return {
      buffer: result.buffer,
      filenameBase: clinicalGuideFilenameBase(
        "atestado",
        result.patientName,
        result.issuedAt,
      ),
    };
  }

  if (input.type === "bundle") {
    if (!input.patientId || !input.appointmentId) return null;

    const contexts: ClinicalGuideContext[] = [];
    const prisma = await getPrisma();
    const [prescriptions, exams, referrals, atestados, patient] = await Promise.all([
      prisma.prescriptionDocument.findMany({
        where: {
          patientId: input.patientId,
          appointmentId: input.appointmentId,
          status: "ATIVA",
          patient: { tenantId: input.tenantId },
        },
        include: {
          items: { orderBy: { sortOrder: "asc" } },
          appointment: { select: { scheduledAt: true } },
          patient: { select: { id: true } },
          provider: { select: { id: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.examOrder.findMany({
        where: {
          patientId: input.patientId,
          appointmentId: input.appointmentId,
          status: { not: "CANCELADO" },
          patient: { tenantId: input.tenantId },
        },
        include: {
          appointment: { select: { scheduledAt: true } },
          patient: { select: { id: true } },
          provider: { select: { id: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.clinicalReferral.findMany({
        where: {
          patientId: input.patientId,
          appointmentId: input.appointmentId,
          status: "ATIVO",
          patient: { tenantId: input.tenantId },
        },
        include: {
          appointment: { select: { scheduledAt: true } },
          patient: { select: { id: true } },
          provider: { select: { id: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.medicalRecord.findMany({
        where: {
          patientId: input.patientId,
          appointmentId: input.appointmentId,
          recordType: "ATESTADO",
          patient: { tenantId: input.tenantId },
        },
        include: {
          appointment: { select: { scheduledAt: true } },
          patient: { select: { id: true } },
          provider: { select: { id: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.patient.findFirst({
        where: { id: input.patientId, tenantId: input.tenantId },
        select: { name: true },
      }),
    ]);

    for (const rx of prescriptions) {
      const parties = await loadPartyBundle(input.tenantId, rx.patient.id, rx.provider.id);
      if (!parties) continue;
      contexts.push(prescriptionContext(parties, rx));
    }

    if (exams.length > 0) {
      const head = exams[0];
      const parties = await loadPartyBundle(input.tenantId, head.patient.id, head.provider.id);
      if (parties) {
        const body = exams
          .map((order, index) => {
            const lines = [`${index + 1}. ${order.examName}`];
            if (order.clinicalIndication) {
              lines.push(`   Indicação: ${order.clinicalIndication}`);
            }
            return lines.join("\n");
          })
          .join("\n\n");
        contexts.push({
          ...parties,
          page: {
            docTypeLabel: "Pedido de exames",
            title:
              exams.length === 1
                ? `Solicitação — ${head.examName}`
                : `Solicitação de ${exams.length} exames`,
            subtitle: "Levar esta guia ao laboratório / serviço de imagem",
            issuedAtLabel: dateTime(head.createdAt),
            appointmentDateLabel: head.appointment
              ? dateTime(head.appointment.scheduledAt)
              : null,
            sections: [{ heading: "Exames solicitados", body }],
            footerNote:
              "Documento assistencial. Confirmar preparo e cobertura com a unidade realizadora.",
          },
        });
      }
    }

    for (const referral of referrals) {
      const parties = await loadPartyBundle(
        input.tenantId,
        referral.patient.id,
        referral.provider.id,
      );
      if (!parties) continue;
      contexts.push(referralContext(parties, referral));
    }

    for (const atestado of atestados) {
      const parties = await loadPartyBundle(
        input.tenantId,
        atestado.patient.id,
        atestado.provider.id,
      );
      if (!parties) continue;
      contexts.push({
        ...parties,
        page: {
          docTypeLabel: "Atestado médico",
          title: atestado.title?.trim() || "Atestado médico",
          subtitle: "Resolução CFM nº 2.381/2024 — documento assistencial",
          issuedAtLabel: dateTime(atestado.createdAt),
          appointmentDateLabel: atestado.appointment
            ? dateTime(atestado.appointment.scheduledAt)
            : null,
          sections: [{ heading: "Texto do atestado", body: atestado.content }],
          footerNote:
            "Em produção nacional, preferir emissão via Atesta CFM ou sistema integrado (Res. CFM 2.382/2024).",
        },
      });
    }

    if (contexts.length === 0) return null;
    const buffer = await buildClinicalGuidePdfBuffer(contexts);
    return {
      buffer,
      filenameBase: clinicalGuideFilenameBase(
        "guias-atendimento",
        patient?.name ?? "paciente",
        new Date(),
      ),
    };
  }

  return null;
}
