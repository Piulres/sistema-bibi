import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as createAppointmentPost } from "@/app/api/interno/appointments/route";
import { POST as registerProcedurePost } from "@/app/api/prestador/appointments/[id]/procedures/route";
import { POST as createInvoicePost } from "@/app/api/interno/invoices/route";
import { POST as createPixPost } from "@/app/api/interno/invoices/[id]/pix/route";
import { POST as confirmPixPost } from "@/app/api/interno/invoices/[id]/confirm-pix/route";
import { GET as billingGet } from "@/app/api/interno/billing/route";
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

describe("Pay Per Use — fluxo completo via API", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("agendamento → procedimento → fatura → PIX → pago", async () => {
    const prisma = getTestPrisma();
    const horizonte = await prisma.tenant.findFirstOrThrow({ where: { slug: "horizonte" } });
    // Paciente descartável — evita faturar PPU pendente do João (fixture da massa demo).
    const patient = await prisma.patient.create({
      data: {
        name: "Paciente Teste PPU",
        cpf: `900.${String(Date.now()).slice(-6)}-00`,
        birthDate: new Date("1990-01-15"),
        tenantId: horizonte.id,
      },
    });
    const provider = await prisma.user.findUniqueOrThrow({
      where: { email: "dra.helena@bibi.health" },
    });
    const procedure = await prisma.procedure.findFirst({
      where: { code: "CON-CLM" },
    });

    expect(patient).toBeTruthy();
    expect(procedure).toBeTruthy();

    const slot = new Date();
    // Horário único por execução para evitar conflito com seed ou runs anteriores
    const dayOffset = 120 + (Date.now() % 30);
    const halfHour = Math.floor(Date.now() / 1000) % 20;
    slot.setDate(slot.getDate() + dayOffset);
    slot.setHours(8 + Math.floor(halfHour / 2), (halfHour % 2) * 30, 0, 0);

    await setSessionForEmail("recepcao@bibi.health");
    const apptRes = await createAppointmentPost(
      jsonRequest("http://localhost/api/interno/appointments", {
        method: "POST",
        body: {
          patientId: patient!.id,
          providerId: provider.id,
          scheduledAt: slot.toISOString(),
          reason: "Teste PPU automatizado",
          status: "CONFIRMADO",
          modality: "PRESENCIAL",
        },
      }),
    );
    expect(apptRes.status).toBe(200);
    const apptBody = await apptRes.json();
    const appointmentId = apptBody.appointment.id as string;

    await setSessionForEmail("dra.helena@bibi.health");
    const procRes = await registerProcedurePost(
      jsonRequest(
        `http://localhost/api/prestador/appointments/${appointmentId}/procedures`,
        { method: "POST", body: { procedureId: procedure!.id } },
      ),
      { params: Promise.resolve({ id: appointmentId }) },
    );
    expect(procRes.status).toBe(200);
    const procBody = await procRes.json();
    expect(procBody.usage.priceCharged).toBeGreaterThan(0);
    expect(procBody.usage.procedure).toBeTruthy();

    await setSessionForEmail("faturamento@bibi.health");
    const billingBefore = await billingGet();
    const billingData = await billingBefore.json();
    const pendingGroup = billingData.pending.find(
      (g: { patientId: string }) => g.patientId === patient!.id,
    );
    expect(pendingGroup).toBeTruthy();

    const invoiceRes = await createInvoicePost(
      jsonRequest("http://localhost/api/interno/invoices", {
        method: "POST",
        body: { patientId: patient!.id },
      }),
    );
    expect(invoiceRes.status).toBe(200);
    const invoiceBody = await invoiceRes.json();
    const invoiceId = invoiceBody.invoice.id as string;
    expect(invoiceBody.invoice.status).toBe("FECHADA");

    const pixRes = await createPixPost(
      jsonRequest(`http://localhost/api/interno/invoices/${invoiceId}/pix`, {
        method: "POST",
        body: {},
      }),
      { params: Promise.resolve({ id: invoiceId }) },
    );
    expect(pixRes.status).toBe(200);
    const pixBody = await pixRes.json();
    expect(pixBody.pixCopyPaste).toContain("BR.GOV.BCB.PIX");
    const paymentId = pixBody.payment.id as string;

    const confirmRes = await confirmPixPost(
      jsonRequest(`http://localhost/api/interno/invoices/${invoiceId}/confirm-pix`, {
        method: "POST",
        body: { paymentId },
      }),
      { params: Promise.resolve({ id: invoiceId }) },
    );
    expect(confirmRes.status).toBe(200);
    const confirmBody = await confirmRes.json();
    expect(confirmBody.payment.status).toBe("CONFIRMED");

    const paid = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    expect(paid.status).toBe("PAGA");
  });
});
