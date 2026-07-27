import "server-only";
import { formatDateTimeBR as dateTime } from "@/lib/timezone";
import { getPrisma } from "@/lib/db";
import { getTenantBranding } from "@/lib/theme/branding";
import {
  buildClinicalGuidePdfBuffer,
  type ClinicalGuideContext,
  type ClinicalGuideClinic,
  type ClinicalGuidePatient,
  type ClinicalGuideProvider,
} from "@/lib/exports/clinical-guide-pdf";
import { prescriptionKindLabel } from "@/lib/clinical/receita";
import {
  referralKindLabel,
  referralUrgencyLabel,
} from "@/lib/clinical/encaminhamento";
import { buildPepRecordPdf } from "@/lib/exports/pep-service";

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
  const [branding, patient, provider] = await Promise.all([
    getTenantBranding(tenantId),
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
    },
    patient: {
      name: patient.name,
      cpf: patient.cpf,
      birthDateLabel: dateOnly(patient.birthDate),
      phone: patient.phone,
      companyName: patient.company?.name ?? null,
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

export async function buildPrescriptionGuidePdf(
  tenantId: string,
  documentId: string,
  options?: { patientId?: string; providerId?: string },
): Promise<Buffer | null> {
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
      patient: { select: { id: true } },
      provider: { select: { id: true } },
    },
  });
  if (!doc) return null;

  const parties = await loadPartyBundle(tenantId, doc.patient.id, doc.provider.id);
  if (!parties) return null;

  const kindLabel = prescriptionKindLabel(doc.prescriptionKind);
  const itemLines = doc.items.map((item, index) => {
    const parts = [
      `${index + 1}. ${item.medication}`,
      `   Dose: ${item.dosage} · ${item.frequency}${item.route ? ` · Via ${item.route}` : ""}`,
    ];
    if (item.durationDays) parts.push(`   Duração: ${item.durationDays} dia(s)`);
    if (item.quantity) parts.push(`   Quantidade: ${item.quantity}`);
    if (item.notes) parts.push(`   Obs.: ${item.notes}`);
    return parts.join("\n");
  });

  const isControlled = doc.prescriptionKind === "CONTROLE_ESPECIAL";
  const ctx: ClinicalGuideContext = {
    ...parties,
    page: {
      docTypeLabel: kindLabel,
      title: doc.title?.trim() || kindLabel,
      subtitle: isControlled
        ? "Receita de Controle Especial — Portaria SVS/MS 344/1998 / RDC 1000/2025"
        : "Receituário simples",
      issuedAtLabel: dateTime(doc.createdAt),
      appointmentDateLabel: doc.appointment
        ? dateTime(doc.appointment.scheduledAt)
        : null,
      sections: [
        { heading: "Prescrição", body: itemLines.join("\n\n") || "—" },
        ...(doc.notes
          ? [{ heading: "Observações", body: doc.notes }]
          : []),
      ],
      footerNote: isControlled
        ? "1ª via — retenção da farmácia · 2ª via — orientação ao paciente. Validade típica: 30 dias."
        : null,
      duplicateViaLabel: isControlled ? "2ª VIA — Orientação ao paciente" : null,
    },
  };

  // Via 1 label for controlled: first page without via label is "1ª via" implied by footer;
  // set first page subtitle to include 1ª via when controlled.
  if (isControlled) {
    ctx.page.subtitle = `${ctx.page.subtitle} · 1ª VIA — Retenção da farmácia`;
  }

  return buildClinicalGuidePdfBuffer([ctx]);
}

export async function buildExamRequestGuidePdf(
  tenantId: string,
  options: {
    appointmentId?: string;
    examOrderId?: string;
    patientId?: string;
    providerId?: string;
  },
): Promise<Buffer | null> {
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
      patient: { select: { id: true } },
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

  return buildClinicalGuidePdfBuffer([ctx]);
}

export async function buildReferralGuidePdf(
  tenantId: string,
  referralId: string,
  options?: { patientId?: string; providerId?: string },
): Promise<Buffer | null> {
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
      patient: { select: { id: true } },
      provider: { select: { id: true } },
    },
  });
  if (!referral) return null;

  const parties = await loadPartyBundle(tenantId, referral.patient.id, referral.provider.id);
  if (!parties) return null;

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

  const ctx: ClinicalGuideContext = {
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

  return buildClinicalGuidePdfBuffer([ctx]);
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
    const buffer = await buildPrescriptionGuidePdf(input.tenantId, input.id, scope);
    return buffer ? { buffer, filenameBase: `receita-${input.id.slice(0, 8)}` } : null;
  }

  if (input.type === "exame") {
    const appointmentId = input.appointmentId ?? undefined;
    const examOrderId = !appointmentId ? input.id ?? undefined : undefined;
    const buffer = await buildExamRequestGuidePdf(input.tenantId, {
      appointmentId,
      examOrderId,
      ...scope,
    });
    const base = appointmentId ?? input.id ?? "exames";
    return buffer ? { buffer, filenameBase: `pedido-exames-${base.slice(0, 8)}` } : null;
  }

  if (input.type === "encaminhamento") {
    if (!input.id) return null;
    const buffer = await buildReferralGuidePdf(input.tenantId, input.id, scope);
    return buffer
      ? { buffer, filenameBase: `encaminhamento-${input.id.slice(0, 8)}` }
      : null;
  }

  if (input.type === "atestado") {
    if (!input.id) return null;
    const buffer = await buildPepRecordPdf(input.tenantId, [input.id], scope);
    return buffer ? { buffer, filenameBase: `atestado-${input.id.slice(0, 8)}` } : null;
  }

  if (input.type === "bundle") {
    if (!input.patientId || !input.appointmentId) return null;

    const contexts: ClinicalGuideContext[] = [];
    const prisma = await getPrisma();
    const [prescriptions, exams, referrals] = await Promise.all([
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
    ]);

    for (const rx of prescriptions) {
      const parties = await loadPartyBundle(input.tenantId, rx.patient.id, rx.provider.id);
      if (!parties) continue;
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
      contexts.push({
        ...parties,
        page: {
          docTypeLabel: kindLabel,
          title: rx.title?.trim() || kindLabel,
          subtitle: isControlled
            ? "Receita de Controle Especial · 1ª VIA — Retenção da farmácia"
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
            ? "1ª via — farmácia · 2ª via — paciente. Validade típica: 30 dias."
            : null,
          duplicateViaLabel: isControlled ? "2ª VIA — Orientação ao paciente" : null,
        },
      });
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
      contexts.push({
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
      });
    }

    if (contexts.length === 0) return null;
    const buffer = await buildClinicalGuidePdfBuffer(contexts);
    return {
      buffer,
      filenameBase: `guias-atendimento-${input.appointmentId.slice(0, 8)}`,
    };
  }

  return null;
}
