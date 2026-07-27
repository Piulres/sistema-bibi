import { describe, expect, it } from "vitest";
import {
  allowedAuditEntityTypes,
  auditDetailLevelForEntity,
  redactMetadataForLevel,
  redactSnapshotForLevel,
  redactTimelineEventForProfile,
  resolveAuditViewerCapabilities,
  sanitizeAuditDescription,
  canAccessPatientClinicalDetail,
  searchableAuditEntityTypes,
} from "@/lib/audit-access";
import type { TimelineEventMetadata } from "@/lib/change-management/types";

function sampleEvent(overrides: Partial<Parameters<typeof redactTimelineEventForProfile>[0]> = {}) {
  return {
    id: "evt-1",
    entityType: "Patient",
    entityId: "pat-1",
    action: "UPDATED",
    description: "Beneficiário João Silva atualizado — CPF 529.982.247-25",
    createdAt: "2026-07-27T12:00:00.000Z",
    createdAtLabel: "27/07/2026 09:00",
    createdBy: "user-1",
    actorName: "Carlos Mendes",
    metadata: {
      before: { name: "João Silva", cpf: "529.982.247-25", phone: "11999990000" },
      after: { name: "João Silva", cpf: "529.982.247-25", phone: "11988880000" },
      fieldsChanged: ["phone"],
    } satisfies TimelineEventMetadata,
    hasDiff: true,
    correlationId: null,
    reversesId: null,
    reversible: true,
    ...overrides,
  };
}

describe("RBAC de auditoria — quem pode ver conteúdo sensível e por quê", () => {
  it("ADMIN recebe diff completo de PII para restore e investigação", () => {
    const event = redactTimelineEventForProfile(sampleEvent(), "ADMIN");
    expect(event).not.toBeNull();
    expect(event!.metadata?.before?.cpf).toBe("529.982.247-25");
    expect(event!.hasDiff).toBe(true);
    expect(event!.reversible).toBe(true);
    expect(resolveAuditViewerCapabilities("INTERNO", "ADMIN").canRestore).toBe(true);
  });

  it("FATURAMENTO mascara CPF/telefone no diff mas mantém evento de cadastro", () => {
    const event = redactTimelineEventForProfile(sampleEvent(), "FATURAMENTO");
    expect(event).not.toBeNull();
    expect(event!.metadata?.before?.cpf).toBe("••••");
    expect(event!.metadata?.after?.phone).toBe("••••");
    expect(event!.metadata?.fieldsChanged).toContain("phone");
    expect(event!.description).not.toContain("529.982.247-25");
    expect(event!.reversible).toBe(false);
  });

  it("FATURAMENTO não vê detalhe clínico (medicamento/prontuário) — só resumo", () => {
    const event = redactTimelineEventForProfile(
      sampleEvent({
        entityType: "MedicationPrescription",
        action: "MEDICATION_PRESCRIBED",
        description: "Prescrição de Dipirona 500mg para Maria Souza",
        metadata: null,
        hasDiff: false,
        reversible: false,
      }),
      "FATURAMENTO",
    );
    expect(event).not.toBeNull();
    expect(event!.description).toContain("detalhe restrito");
    expect(event!.description).not.toContain("Dipirona");
    expect(event!.metadata).toBeNull();
  });

  it("RECEPCAO não recebe eventos clínicos nem de segurança na atividade recente", () => {
    const clinical = redactTimelineEventForProfile(
      sampleEvent({ entityType: "MedicalRecord", action: "MEDICAL_RECORD_CREATED" }),
      "RECEPCAO",
    );
    const security = redactTimelineEventForProfile(
      sampleEvent({ entityType: "Security", action: "MFA_ENABLED" }),
      "RECEPCAO",
    );
    const referral = redactTimelineEventForProfile(
      sampleEvent({
        entityType: "ClinicalReferral",
        action: "REFERRAL_CREATED",
        description: "Encaminhamento para cardiologia",
      }),
      "RECEPCAO",
    );
    expect(clinical).toBeNull();
    expect(security).toBeNull();
    expect(referral).toBeNull();
    expect(allowedAuditEntityTypes("RECEPCAO")).not.toContain("MedicalRecord");
    expect(allowedAuditEntityTypes("RECEPCAO")).not.toContain("Security");
    expect(allowedAuditEntityTypes("RECEPCAO")).not.toContain("ClinicalReferral");
    expect(allowedAuditEntityTypes("RECEPCAO")).not.toContain("PrescriptionDocument");
  });

  it("detalhe clínico do Cliente 360° só ADMIN — RECEPCAO/FATURAMENTO não veem PEP", () => {
    expect(canAccessPatientClinicalDetail("ADMIN")).toBe(true);
    expect(canAccessPatientClinicalDetail("FATURAMENTO")).toBe(false);
    expect(canAccessPatientClinicalDetail("RECEPCAO")).toBe(false);
    expect(canAccessPatientClinicalDetail("READONLY")).toBe(false);
    expect(canAccessPatientClinicalDetail(null)).toBe(false);
  });

  it("busca por descrição só cobre tipos full — evita oráculo de existência clínica/PII", () => {
    expect(searchableAuditEntityTypes("FATURAMENTO")).toContain("PricingRule");
    expect(searchableAuditEntityTypes("FATURAMENTO")).toContain("Appointment");
    expect(searchableAuditEntityTypes("FATURAMENTO")).not.toContain("MedicationPrescription");
    expect(searchableAuditEntityTypes("FATURAMENTO")).not.toContain("Patient");
    expect(searchableAuditEntityTypes("FATURAMENTO")).not.toContain("ClinicalReferral");
    expect(searchableAuditEntityTypes("READONLY")).toEqual([]);
    expect(searchableAuditEntityTypes("ADMIN")).toContain("MedicationPrescription");
  });

  it("READONLY vê financeiro só em resumo — sem multiplier no metadata", () => {
    const event = redactTimelineEventForProfile(
      sampleEvent({
        entityType: "PricingRule",
        action: "UPDATED",
        description: "Precificação atualizada — multiplicador 0,9 · R$ 150,00",
        metadata: {
          before: { multiplier: 1, procedureName: "Consulta" },
          after: { multiplier: 0.9, procedureName: "Consulta" },
          fieldsChanged: ["multiplier"],
        },
        hasDiff: true,
      }),
      "READONLY",
    );
    expect(event).not.toBeNull();
    expect(event!.metadata).toBeNull();
    expect(event!.hasDiff).toBe(false);
    expect(event!.description).toContain("R$ •••");
    expect(auditDetailLevelForEntity("READONLY", "PricingRule")).toBe("summary");
  });

  it("sanitize e redact helpers mascaram documentos e snapshots sem nível full", () => {
    expect(
      sanitizeAuditDescription(
        "Fatura emitida R$ 1.234,56 para CPF 529.982.247-25",
        "Invoice",
        "INVOICE_ISSUED",
        "summary",
      ),
    ).toBe("Fatura emitida R$ ••• para CPF ***.***.***-**");

    const meta = redactMetadataForLevel(
      {
        before: { cpf: "529.982.247-25", name: "Ana" },
        after: { cpf: "529.982.247-25", name: "Ana Lima" },
        fieldsChanged: ["name"],
      },
      "redacted",
    );
    expect(meta?.before?.cpf).toBe("••••");
    expect(meta?.after?.name).toBe("Ana Lima");

    const snap = redactSnapshotForLevel({ cpf: "111", multiplier: 2 }, "summary", {
      maskFinancial: true,
    });
    expect(snap).toEqual({ _redacted: true, fields: ["cpf", "multiplier"] });
  });
});
