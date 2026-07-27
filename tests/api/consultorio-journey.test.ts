/**
 * Jornada no consultório — cobertura API alinhada a
 * docs/produto/JORNADA_CONSULTORIO.md (Atos 1–4).
 *
 * Cobre: walk-in → check-in → PEP → procedimento (+estoque) → REALIZADO →
 * fatura → PIX → pago; variante marcar paga; cadastros (pacientes/procedimentos/estoque).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as walkInPost } from "@/app/api/interno/appointments/walk-in/route";
import { PATCH as internoApptPatch } from "@/app/api/interno/appointments/[id]/route";
import { POST as registerProcedurePost } from "@/app/api/prestador/appointments/[id]/procedures/route";
import { PATCH as prestadorApptPatch } from "@/app/api/prestador/appointments/[id]/route";
import { POST as recordsPost } from "@/app/api/prestador/records/route";
import { POST as createInvoicePost } from "@/app/api/interno/invoices/route";
import { POST as createPixPost } from "@/app/api/interno/invoices/[id]/pix/route";
import { POST as confirmPixPost } from "@/app/api/interno/invoices/[id]/confirm-pix/route";
import { POST as markPaidPost } from "@/app/api/interno/invoices/[id]/pay/route";
import { GET as billingGet } from "@/app/api/interno/billing/route";
import { GET as patientsGet } from "@/app/api/interno/patients/route";
import { GET as proceduresGet } from "@/app/api/interno/procedures/route";
import { GET as stockProductsGet } from "@/app/api/interno/stock/products/route";
import { GET as stockAlertsGet } from "@/app/api/interno/stock/alerts/route";
import {
  deriveCareJourneyBilling,
  resolveCareJourneyStep,
} from "@/lib/care-journey";
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
  const base = String(Date.now() % 1_000_000_000)
    .padStart(9, "0")
    .slice(-9)
    .split("")
    .map(Number);
  const w1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  const mod = (nums: number[], weights: number[]) => {
    const sum = nums.reduce((acc, d, i) => acc + d * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = mod(base, w1);
  const d2 = mod([...base, d1], w2);
  return [...base, d1, d2].join("");
}

function uniqueSlot(): Date {
  const slot = new Date();
  const dayOffset = 150 + (Date.now() % 40);
  const halfHour = Math.floor(Date.now() / 1000) % 20;
  slot.setDate(slot.getDate() + dayOffset);
  slot.setHours(8 + Math.floor(halfHour / 2), (halfHour % 2) * 30, 0, 0);
  return slot;
}

describe("Jornada consultório — Atos 1–4 (API)", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("walk-in → check-in → PEP → procedimento/estoque → REALIZADO → fatura PIX → PAGA", async () => {
    const prisma = getTestPrisma();
    const provider = await prisma.user.findUniqueOrThrow({
      where: { email: "dra.helena@bibi.health" },
    });
    const procedure = await prisma.procedure.findFirstOrThrow({
      where: { code: "CON-CLM" },
    });
    const luva = await prisma.medicalProduct.findFirst({
      where: { sku: "MAT-LUVA-M" },
    });

    const stockBefore = luva
      ? (
          await prisma.stockLot.aggregate({
            where: { productId: luva.id, status: "DISPONIVEL" },
            _sum: { quantity: true },
          })
        )._sum.quantity ?? 0
      : null;

    // Ato 1 — Walk-in (recepção)
    await setSessionForEmail("recepcao@bibi.health");
    const walkInName = `Jornada Walk-in ${Date.now()}`;
    const walkRes = await walkInPost(
      jsonRequest("http://localhost/api/interno/appointments/walk-in", {
        method: "POST",
        body: {
          name: walkInName,
          cpf: generateValidCpf(),
          birthDate: "1991-04-20",
          providerId: provider.id,
          scheduledAt: uniqueSlot().toISOString(),
          reason: "Jornada consultório automatizada",
        },
      }),
    );
    expect(walkRes.status, await walkRes.clone().text()).toBe(200);
    const walkBody = await walkRes.json();
    const appointmentId = walkBody.appointment.id as string;
    const patientId = walkBody.patient.id as string;
    expect(walkBody.appointment.status).toBe("AGENDADO");
    expect(resolveCareJourneyStep({ appointmentStatus: "AGENDADO" })).toBe("agendado");

    // Ato 2 — Check-in
    const checkInRes = await internoApptPatch(
      jsonRequest(`http://localhost/api/interno/appointments/${appointmentId}`, {
        method: "PATCH",
        body: { status: "CONFIRMADO" },
      }),
      { params: Promise.resolve({ id: appointmentId }) },
    );
    expect(checkInRes.status, await checkInRes.clone().text()).toBe(200);
    const afterCheckIn = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointmentId },
    });
    expect(afterCheckIn.status).toBe("CONFIRMADO");
    expect(resolveCareJourneyStep({ appointmentStatus: "CONFIRMADO" })).toBe("confirmado");

    // Ato 3 — Médico: PEP + procedimento (+ baixa estoque se kit) + REALIZADO
    await setSessionForEmail("dra.helena@bibi.health");
    const pepRes = await recordsPost(
      jsonRequest("http://localhost/api/prestador/records", {
        method: "POST",
        body: {
          patientId,
          appointmentId,
          recordType: "EVOLUCAO",
          title: "Evolução — jornada consultório",
          content: "Paciente em bom estado geral. Conduta: procedimento clínico.",
        },
      }),
    );
    expect(pepRes.status, await pepRes.clone().text()).toBe(200);
    const pepBody = await pepRes.json();
    expect(pepBody.record.id).toBeTruthy();

    const procRes = await registerProcedurePost(
      jsonRequest(
        `http://localhost/api/prestador/appointments/${appointmentId}/procedures`,
        { method: "POST", body: { procedureId: procedure.id } },
      ),
      { params: Promise.resolve({ id: appointmentId }) },
    );
    expect(procRes.status, await procRes.clone().text()).toBe(200);
    const procBody = await procRes.json();
    expect(procBody.usage.priceCharged).toBeGreaterThan(0);
    const usageRow = await prisma.procedureUsage.findUniqueOrThrow({
      where: { id: procBody.usage.id as string },
    });
    expect(usageRow.billed).toBe(false);

    if (luva && stockBefore != null && Array.isArray(procBody.stockConsumed)) {
      const stockAfter =
        (
          await prisma.stockLot.aggregate({
            where: { productId: luva.id, status: "DISPONIVEL" },
            _sum: { quantity: true },
          })
        )._sum.quantity ?? 0;
      if (procBody.stockConsumed.length > 0) {
        expect(stockAfter).toBeLessThan(stockBefore);
      }
    }

    const doneRes = await prestadorApptPatch(
      jsonRequest(`http://localhost/api/prestador/appointments/${appointmentId}`, {
        method: "PATCH",
        body: { status: "REALIZADO" },
      }),
      { params: Promise.resolve({ id: appointmentId }) },
    );
    expect(doneRes.status, await doneRes.clone().text()).toBe(200);
    expect(resolveCareJourneyStep({ appointmentStatus: "REALIZADO", hasUnbilledUsages: true })).toBe(
      "realizado",
    );

    // Ato 4 — Faturamento + PIX
    await setSessionForEmail("faturamento@bibi.health");
    const billing = await (await billingGet()).json();
    const pending = billing.pending.find(
      (g: { patientId: string }) => g.patientId === patientId,
    );
    expect(pending).toBeTruthy();

    const invoiceRes = await createInvoicePost(
      jsonRequest("http://localhost/api/interno/invoices", {
        method: "POST",
        body: { patientId },
      }),
    );
    expect(invoiceRes.status, await invoiceRes.clone().text()).toBe(200);
    const invoiceBody = await invoiceRes.json();
    const invoiceId = invoiceBody.invoice.id as string;
    expect(invoiceBody.invoice.status).toBe("FECHADA");

    const billingFlags = deriveCareJourneyBilling({
      usages: [{ billed: true, invoiceStatus: "FECHADA" }],
    });
    expect(resolveCareJourneyStep({ appointmentStatus: "REALIZADO", ...billingFlags })).toBe(
      "faturado",
    );

    const pixRes = await createPixPost(
      jsonRequest(`http://localhost/api/interno/invoices/${invoiceId}/pix`, {
        method: "POST",
        body: {},
      }),
      { params: Promise.resolve({ id: invoiceId }) },
    );
    expect(pixRes.status, await pixRes.clone().text()).toBe(200);
    const pixBody = await pixRes.json();
    expect(pixBody.pixCopyPaste).toContain("BR.GOV.BCB.PIX");

    const confirmRes = await confirmPixPost(
      jsonRequest(`http://localhost/api/interno/invoices/${invoiceId}/confirm-pix`, {
        method: "POST",
        body: { paymentId: pixBody.payment.id },
      }),
      { params: Promise.resolve({ id: invoiceId }) },
    );
    expect(confirmRes.status, await confirmRes.clone().text()).toBe(200);

    const paid = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    expect(paid.status).toBe("PAGA");
    expect(
      resolveCareJourneyStep({
        appointmentStatus: "REALIZADO",
        ...deriveCareJourneyBilling({ usages: [{ billed: true, invoiceStatus: "PAGA" }] }),
      }),
    ).toBe("pago");

    const records = await prisma.medicalRecord.count({ where: { appointmentId } });
    expect(records).toBeGreaterThanOrEqual(1);
  });

  it("variante fechamento: marcar paga manual (sem PIX)", async () => {
    const prisma = getTestPrisma();
    const provider = await prisma.user.findUniqueOrThrow({
      where: { email: "dra.helena@bibi.health" },
    });
    const horizonte = await prisma.tenant.findFirstOrThrow({ where: { slug: "horizonte" } });
    const procedure = await prisma.procedure.findFirstOrThrow({
      where: { code: "CON-CLM" },
    });

    const patient = await prisma.patient.create({
      data: {
        name: `Particular Manual ${Date.now()}`,
        cpf: generateValidCpf(),
        birthDate: new Date("1988-08-08"),
        tenantId: horizonte.id,
      },
    });

    await setSessionForEmail("recepcao@bibi.health");
    const { POST: createAppointmentPost } = await import("@/app/api/interno/appointments/route");
    const apptRes = await createAppointmentPost(
      jsonRequest("http://localhost/api/interno/appointments", {
        method: "POST",
        body: {
          patientId: patient.id,
          providerId: provider.id,
          scheduledAt: uniqueSlot().toISOString(),
          reason: "Fechamento manual",
          status: "CONFIRMADO",
          modality: "PRESENCIAL",
        },
      }),
    );
    expect(apptRes.status).toBe(200);
    const appointmentId = (await apptRes.json()).appointment.id as string;

    await setSessionForEmail("dra.helena@bibi.health");
    const procRes = await registerProcedurePost(
      jsonRequest(
        `http://localhost/api/prestador/appointments/${appointmentId}/procedures`,
        { method: "POST", body: { procedureId: procedure.id } },
      ),
      { params: Promise.resolve({ id: appointmentId }) },
    );
    expect(procRes.status).toBe(200);

    await prestadorApptPatch(
      jsonRequest(`http://localhost/api/prestador/appointments/${appointmentId}`, {
        method: "PATCH",
        body: { status: "REALIZADO" },
      }),
      { params: Promise.resolve({ id: appointmentId }) },
    );

    await setSessionForEmail("faturamento@bibi.health");
    const invoiceRes = await createInvoicePost(
      jsonRequest("http://localhost/api/interno/invoices", {
        method: "POST",
        body: { patientId: patient.id },
      }),
    );
    expect(invoiceRes.status).toBe(200);
    const invoiceId = (await invoiceRes.json()).invoice.id as string;

    const payRes = await markPaidPost(
      jsonRequest(`http://localhost/api/interno/invoices/${invoiceId}/pay`, {
        method: "POST",
        body: { method: "MANUAL" },
      }),
      { params: Promise.resolve({ id: invoiceId }) },
    );
    expect(payRes.status, await payRes.clone().text()).toBe(200);
    const payBody = await payRes.json();
    expect(payBody.payment?.status).toBe("CONFIRMED");
    expect(payBody.payment?.method).toBe("MANUAL");

    const invoice = await prisma.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: { payments: true },
    });
    expect(invoice.status).toBe("PAGA");
    expect(invoice.payments.some((p) => p.method === "MANUAL" && p.status === "CONFIRMED")).toBe(
      true,
    );

    // Idempotência: segunda tentativa não deve reverter nem criar inconsistência
    const payAgain = await markPaidPost(
      jsonRequest(`http://localhost/api/interno/invoices/${invoiceId}/pay`, {
        method: "POST",
        body: { method: "MANUAL" },
      }),
      { params: Promise.resolve({ id: invoiceId }) },
    );
    expect(payAgain.status).toBe(400);
    const again = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    expect(again.status).toBe("PAGA");
  });

  it("cadastros operacionais acessíveis na jornada (pacientes, procedimentos, estoque)", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const patients = await patientsGet();
    expect(patients.status).toBe(200);
    const patientsBody = await patients.json();
    expect(Array.isArray(patientsBody.patients)).toBe(true);

    const procedures = await proceduresGet();
    expect(procedures.status).toBe(200);
    const procBody = await procedures.json();
    expect(Array.isArray(procBody.procedures)).toBe(true);
    expect(procBody.procedures.length).toBeGreaterThan(0);

    const stock = await stockProductsGet();
    expect(stock.status).toBe(200);
    const stockBody = await stock.json();
    expect(Array.isArray(stockBody.products)).toBe(true);

    const alerts = await stockAlertsGet();
    expect(alerts.status).toBe(200);

    // RBAC: faturamento não acessa estoque/cadastros
    await setSessionForEmail("financeiro@bibi.health");
    expect((await stockProductsGet()).status).toBe(403);
    expect((await patientsGet()).status).toBe(403);
  });
});
