import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as revisionsGet } from "@/app/api/interno/revisions/route";
import { POST as restorePost } from "@/app/api/interno/audit/[eventId]/restore/route";
import { POST as revertRecentPost } from "@/app/api/interno/change/revert-recent/route";
import { POST as walkInPost } from "@/app/api/interno/appointments/walk-in/route";
import { POST as voidInvoicePost } from "@/app/api/interno/invoices/[id]/void/route";
import { PATCH as patientPatch } from "@/app/api/interno/patients/[id]/route";
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

function generateValidCpf(): string {
  const seed = Date.now() % 1000000000;
  const nine = String(seed).padStart(9, "0");
  const nums = nine.split("").map(Number);
  const sum1 = nums.reduce((acc, d, i) => acc + d * (10 - i), 0);
  let d1 = (sum1 * 10) % 11;
  if (d1 === 10) d1 = 0;
  const sum2 = [...nums, d1].reduce((acc, d, i) => acc + d * (11 - i), 0);
  let d2 = (sum2 * 10) % 11;
  if (d2 === 10) d2 = 0;
  return nine + String(d1) + String(d2);
}

describe("Change management — pacotes B–D", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("restore exige confirmação RESTAURAR", async () => {
    const prisma = getTestPrisma();
    const patient = await prisma.patient.findFirstOrThrow({
      where: { cpf: "111.222.333-44" },
    });

    await setSessionForEmail("faturamento@bibi.health");
    await patientPatch(
      jsonRequest(`http://localhost/api/interno/patients/${patient.id}`, {
        method: "PATCH",
        body: { phone: "11988887777" },
      }),
      { params: Promise.resolve({ id: patient.id }) },
    );

    const event = await prisma.timelineEvent.findFirstOrThrow({
      where: { entityType: "Patient", entityId: patient.id, action: "UPDATED" },
      orderBy: { createdAt: "desc" },
    });

    const noConfirm = await restorePost(
      jsonRequest(`http://localhost/api/interno/audit/${event.id}/restore`, {
        method: "POST",
        body: {},
      }),
      { params: Promise.resolve({ eventId: event.id }) },
    );
    expect(noConfirm.status).toBe(400);

    const ok = await restorePost(
      jsonRequest(`http://localhost/api/interno/audit/${event.id}/restore`, {
        method: "POST",
        body: { confirm: "RESTAURAR" },
      }),
      { params: Promise.resolve({ eventId: event.id }) },
    );
    expect(ok.status).toBe(200);
  });

  it("revert-recent desfaz UPDATE do usuário logado", async () => {
    const prisma = getTestPrisma();
    const patient = await prisma.patient.findFirstOrThrow({
      where: { cpf: "111.222.333-44" },
    });
    const originalPhone = patient.phone;

    await setSessionForEmail("faturamento@bibi.health");
    const newPhone = originalPhone === "11911112222" ? "11933334444" : "11911112222";
    await patientPatch(
      jsonRequest(`http://localhost/api/interno/patients/${patient.id}`, {
        method: "PATCH",
        body: { phone: newPhone },
      }),
      { params: Promise.resolve({ id: patient.id }) },
    );

    const revertRes = await revertRecentPost(
      jsonRequest("http://localhost/api/interno/change/revert-recent", {
        method: "POST",
        body: { entityType: "Patient", entityId: patient.id },
      }),
    );
    expect(revertRes.status).toBe(200);

    const updated = await prisma.patient.findUniqueOrThrow({ where: { id: patient.id } });
    expect(updated.phone).toBe(originalPhone);
  });

  it("walk-in grava correlationId compartilhado", async () => {
    const prisma = getTestPrisma();
    const provider = await prisma.user.findFirstOrThrow({ where: { role: "PRESTADOR" } });
    const cpf = generateValidCpf();
    const scheduledAt = new Date(Date.now() + 3_600_000).toISOString();

    await setSessionForEmail("faturamento@bibi.health");
    const res = await walkInPost(
      jsonRequest("http://localhost/api/interno/appointments/walk-in", {
        method: "POST",
        body: {
          name: "Walk-in Teste CM",
          cpf,
          birthDate: "1990-01-15",
          providerId: provider.id,
          scheduledAt,
          reason: "Teste correlation",
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.correlationId).toBeTruthy();

    const events = await prisma.timelineEvent.findMany({
      where: { correlationId: body.correlationId },
    });
    expect(events.length).toBeGreaterThanOrEqual(2);
  });

  it("procedure UPDATE cria EntityRevision", async () => {
    const prisma = getTestPrisma();
    const procedure = await prisma.procedure.findFirstOrThrow();
    const originalName = procedure.name;

    await setSessionForEmail("faturamento@bibi.health");
    const { PUT: procedurePut } = await import("@/app/api/interno/procedures/[id]/route");
    await procedurePut(
      jsonRequest(`http://localhost/api/interno/procedures/${procedure.id}`, {
        method: "PUT",
        body: { name: `${originalName} Rev` },
      }),
      { params: Promise.resolve({ id: procedure.id }) },
    );

    const revisionsRes = await revisionsGet(
      jsonRequest(
        `http://localhost/api/interno/revisions?entityType=Procedure&entityId=${procedure.id}`,
      ),
    );
    expect(revisionsRes.status).toBe(200);
    const revisionsBody = await revisionsRes.json();
    expect(revisionsBody.revisions.length).toBeGreaterThan(0);

    await procedurePut(
      jsonRequest(`http://localhost/api/interno/procedures/${procedure.id}`, {
        method: "PUT",
        body: { name: originalName },
      }),
      { params: Promise.resolve({ id: procedure.id }) },
    );
  });

  it("void fatura FECHADA libera usages", async () => {
    const prisma = getTestPrisma();
    const horizonte = await prisma.tenant.findFirstOrThrow({ where: { slug: "horizonte" } });
    const provider = await prisma.user.findFirstOrThrow({ where: { email: "dra.helena@bibi.health" } });
    const procedure = await prisma.procedure.findFirstOrThrow({ where: { code: "CON-CLM" } });
    const patient = await prisma.patient.create({
      data: {
        name: "Paciente Teste Void",
        cpf: generateValidCpf(),
        birthDate: new Date("1988-06-20"),
        tenantId: horizonte.id,
      },
    });
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: horizonte.id,
        patientId: patient.id,
        providerId: provider.id,
        scheduledAt: new Date(Date.now() + 86_400_000),
        reason: "Teste void CM",
        status: "REALIZADO",
        modality: "PRESENCIAL",
      },
    });
    const usage = await prisma.procedureUsage.create({
      data: {
        appointmentId: appointment.id,
        procedureId: procedure.id,
        priceCharged: procedure.basePrice,
        billed: false,
      },
    });
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: horizonte.id,
        patientId: patient.id,
        total: procedure.basePrice,
        status: "FECHADA",
        items: {
          create: [
            {
              description: procedure.name,
              amount: procedure.basePrice,
              usageId: usage.id,
            },
          ],
        },
      },
      include: { items: true },
    });
    await prisma.procedureUsage.update({ where: { id: usage.id }, data: { billed: true } });

    await setSessionForEmail("faturamento@bibi.health");
    const res = await voidInvoicePost(
      jsonRequest(`http://localhost/api/interno/invoices/${invoice.id}/void`, {
        method: "POST",
        body: { reason: "Teste void" },
      }),
      { params: Promise.resolve({ id: invoice.id }) },
    );
    expect(res.status).toBe(200);

    const updated = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(updated.status).toBe("ANULADA");

    const usageIds = invoice.items.map((i) => i.usageId).filter(Boolean) as string[];
    if (usageIds.length > 0) {
      const usages = await prisma.procedureUsage.findMany({ where: { id: { in: usageIds } } });
      expect(usages.every((u) => !u.billed)).toBe(true);
    }
  });

  it("RECEPCAO não restaura via auditoria", async () => {
    const prisma = getTestPrisma();
    const event = await prisma.timelineEvent.findFirst({
      where: { reversible: true, metadata: { not: null } },
      orderBy: { createdAt: "desc" },
    });
    if (!event) return;

    await setSessionForEmail("recepcao@bibi.health");
    const res = await restorePost(
      jsonRequest(`http://localhost/api/interno/audit/${event.id}/restore`, {
        method: "POST",
        body: { confirm: "RESTAURAR" },
      }),
      { params: Promise.resolve({ eventId: event.id }) },
    );
    expect(res.status).toBe(403);
  });
});
