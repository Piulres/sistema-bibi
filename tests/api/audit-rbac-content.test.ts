import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as auditGet } from "@/app/api/interno/audit/route";
import { GET as dashboardGet } from "@/app/api/interno/dashboard/route";
import { jsonRequest } from "../helpers/request";
import { getTestPrisma } from "../helpers/db";
import {
  clearSessionMock,
  sessionMockState,
  setSessionForEmail,
} from "../helpers/session-mock";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "bibi_session" && sessionMockState.token
        ? { value: sessionMockState.token }
        : undefined,
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe("Auditoria RBAC de conteúdo — evita vazamento de PII/clínico por perfil", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("ADMIN vê CPF no diff de beneficiário e capabilities.canRestore=true", async () => {
    const prisma = getTestPrisma();
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: "faturamento@bibi.health" },
    });
    const patient = await prisma.patient.findFirstOrThrow({
      where: { tenantId: admin.tenantId, cpf: { not: "" } },
    });

    await prisma.timelineEvent.create({
      data: {
        tenantId: admin.tenantId,
        entityType: "Patient",
        entityId: patient.id,
        action: "UPDATED",
        description: `Beneficiário ${patient.name} atualizado — CPF ${patient.cpf}`,
        createdBy: admin.id,
        reversible: true,
        metadata: JSON.stringify({
          before: { name: patient.name, cpf: patient.cpf, phone: "11911112222" },
          after: { name: patient.name, cpf: patient.cpf, phone: "11933334444" },
          fieldsChanged: ["phone"],
        }),
      },
    });

    await setSessionForEmail("faturamento@bibi.health");
    const res = await auditGet(
      jsonRequest("http://localhost/api/interno/audit?entityType=Patient&limit=20"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.capabilities.canRestore).toBe(true);
    const withCpf = body.events.find(
      (event: { metadata?: { before?: { cpf?: string } } }) =>
        event.metadata?.before?.cpf === patient.cpf,
    );
    expect(withCpf).toBeTruthy();
  });

  it("FATURAMENTO mascara CPF no diff e não lista restore capability", async () => {
    const prisma = getTestPrisma();
    const billing = await prisma.user.findUniqueOrThrow({
      where: { email: "financeiro@bibi.health" },
    });
    const patient = await prisma.patient.findFirstOrThrow({
      where: { tenantId: billing.tenantId, cpf: { not: "" } },
    });

    await prisma.timelineEvent.create({
      data: {
        tenantId: billing.tenantId,
        entityType: "Patient",
        entityId: patient.id,
        action: "UPDATED",
        description: `Cadastro alterado — CPF ${patient.cpf}`,
        createdBy: billing.id,
        reversible: true,
        metadata: JSON.stringify({
          before: { name: patient.name, cpf: patient.cpf },
          after: { name: `${patient.name} Alt`, cpf: patient.cpf },
          fieldsChanged: ["name"],
        }),
      },
    });

    await setSessionForEmail("financeiro@bibi.health");
    const res = await auditGet(
      jsonRequest("http://localhost/api/interno/audit?entityType=Patient&limit=30"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.capabilities.canRestore).toBe(false);
    expect(body.capabilities.profile).toBe("FATURAMENTO");

    const match = body.events.find(
      (event: { entityId: string; metadata?: { before?: { cpf?: string } } }) =>
        event.entityId === patient.id && event.metadata?.before?.cpf,
    );
    expect(match).toBeTruthy();
    expect(match.metadata.before.cpf).toBe("••••");
    expect(JSON.stringify(body.events)).not.toContain(patient.cpf);
  });

  it("FATURAMENTO recebe só resumo de evento clínico — sem nome de medicamento", async () => {
    const prisma = getTestPrisma();
    const billing = await prisma.user.findUniqueOrThrow({
      where: { email: "financeiro@bibi.health" },
    });

    await prisma.timelineEvent.create({
      data: {
        tenantId: billing.tenantId,
        entityType: "MedicationPrescription",
        entityId: "med-rbac-test",
        action: "MEDICATION_PRESCRIBED",
        description: "Prescrição de Amoxicilina 500mg para Camila Rocha",
        createdBy: billing.id,
      },
    });

    await setSessionForEmail("financeiro@bibi.health");
    const res = await auditGet(
      jsonRequest(
        "http://localhost/api/interno/audit?entityType=MedicationPrescription&limit=20",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const clinical = body.events.find(
      (event: { entityId: string }) => event.entityId === "med-rbac-test",
    );
    expect(clinical).toBeTruthy();
    expect(clinical.description).toContain("detalhe restrito");
    expect(clinical.description).not.toContain("Amoxicilina");
    expect(clinical.metadata).toBeNull();
  });

  it("RECEPCAO no dashboard não recebe atividade clínica na lista recente", async () => {
    const prisma = getTestPrisma();
    const reception = await prisma.user.findUniqueOrThrow({
      where: { email: "recepcao@bibi.health" },
    });

    await prisma.timelineEvent.create({
      data: {
        tenantId: reception.tenantId,
        entityType: "MedicalRecord",
        entityId: "pep-rbac-test",
        action: "MEDICAL_RECORD_CREATED",
        description: "Anotação clínica criada para paciente sensível",
        createdBy: reception.id,
      },
    });
    await prisma.timelineEvent.create({
      data: {
        tenantId: reception.tenantId,
        entityType: "Appointment",
        entityId: "appt-rbac-test",
        action: "CREATED",
        description: "Agendamento criado para Camila Rocha",
        createdBy: reception.id,
      },
    });

    await setSessionForEmail("recepcao@bibi.health");
    const res = await dashboardGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    const activity = body.dashboard.recentActivity as Array<{
      description: string;
      action: string;
    }>;
    expect(
      activity.some((item) => item.description.includes("paciente sensível")),
    ).toBe(false);
    expect(
      activity.some((item) => item.description.includes("Anotação clínica")),
    ).toBe(false);
  });

  it("filtros da API omitem entityTypes clínicos para RECEPCAO via módulo auditoria negado", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const res = await auditGet(jsonRequest("http://localhost/api/interno/audit"));
    expect(res.status).toBe(403);
  });

  it("FATURAMENTO não descobre medicamento via ?search= — oráculo de existência bloqueado", async () => {
    const prisma = getTestPrisma();
    const billing = await prisma.user.findUniqueOrThrow({
      where: { email: "financeiro@bibi.health" },
    });
    const secretMed = `ClopidogrelSecreto${Date.now()}`;

    await prisma.timelineEvent.create({
      data: {
        tenantId: billing.tenantId,
        entityType: "MedicationPrescription",
        entityId: `med-oracle-${Date.now()}`,
        action: "MEDICATION_PRESCRIBED",
        description: `Prescrição de ${secretMed} para Laura Dias`,
        createdBy: billing.id,
      },
    });

    await setSessionForEmail("financeiro@bibi.health");
    const res = await auditGet(
      jsonRequest(
        `http://localhost/api/interno/audit?search=${encodeURIComponent(secretMed)}&limit=20`,
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.events).toHaveLength(0);
  });

  it("encaminhamento clínico não aparece no dashboard da RECEPCAO", async () => {
    const prisma = getTestPrisma();
    const reception = await prisma.user.findUniqueOrThrow({
      where: { email: "recepcao@bibi.health" },
    });
    const marker = `EncaminhamentoCardiologia${Date.now()}`;

    await prisma.timelineEvent.create({
      data: {
        tenantId: reception.tenantId,
        entityType: "ClinicalReferral",
        entityId: `ref-rbac-${Date.now()}`,
        action: "REFERRAL_CREATED",
        description: marker,
        createdBy: reception.id,
      },
    });

    await setSessionForEmail("recepcao@bibi.health");
    const res = await dashboardGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    const activity = body.dashboard.recentActivity as Array<{ description: string }>;
    expect(activity.some((item) => item.description.includes(marker))).toBe(false);
  });
});
