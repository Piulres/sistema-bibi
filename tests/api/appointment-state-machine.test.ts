import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as createAppointmentPost } from "@/app/api/interno/appointments/route";
import {
  PATCH as prestadorPatch,
} from "@/app/api/prestador/appointments/[id]/route";
import { POST as registerProcedurePost } from "@/app/api/prestador/appointments/[id]/procedures/route";
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

async function createConfirmedAppointment(): Promise<string> {
  const prisma = getTestPrisma();
  const horizonte = await prisma.tenant.findFirstOrThrow({ where: { slug: "horizonte" } });
  const provider = await prisma.user.findUniqueOrThrow({
    where: { email: "dra.helena@bibi.health" },
  });
  const patient = await prisma.patient.create({
    data: {
      name: "Paciente Máquina de Estados",
      cpf: `901.${String(Date.now()).slice(-6)}-00`,
      birthDate: new Date("1990-01-15"),
      tenantId: horizonte.id,
    },
  });

  const slot = new Date();
  slot.setDate(slot.getDate() + 200 + (Date.now() % 40));
  slot.setHours(9, (Date.now() % 2) * 30, 0, 0);

  await setSessionForEmail("recepcao@bibi.health");
  const res = await createAppointmentPost(
    jsonRequest("http://localhost/api/interno/appointments", {
      method: "POST",
      body: {
        patientId: patient.id,
        providerId: provider.id,
        scheduledAt: slot.toISOString(),
        reason: "Teste máquina de estados",
        status: "CONFIRMADO",
        modality: "PRESENCIAL",
      },
    }),
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  return body.appointment.id as string;
}

function patchStatus(id: string, status: string) {
  return prestadorPatch(
    jsonRequest(`http://localhost/api/prestador/appointments/${id}`, {
      method: "PATCH",
      body: { status },
    }),
    { params: Promise.resolve({ id }) },
  );
}

function registerProcedure(id: string, procedureId: string) {
  return registerProcedurePost(
    jsonRequest(`http://localhost/api/prestador/appointments/${id}/procedures`, {
      method: "POST",
      body: { procedureId },
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("Máquina de estados do agendamento — regras de negócio", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("bloqueia registrar procedimento em agendamento CANCELADO", async () => {
    const prisma = getTestPrisma();
    const appointmentId = await createConfirmedAppointment();
    const procedure = await prisma.procedure.findFirstOrThrow({ where: { code: "CON-CLM" } });

    await setSessionForEmail("dra.helena@bibi.health");
    const cancel = await patchStatus(appointmentId, "CANCELADO");
    expect(cancel.status).toBe(200);

    const proc = await registerProcedure(appointmentId, procedure.id);
    expect(proc.status).toBe(409);

    // Não deve ter criado cobrança nem uso.
    const usages = await prisma.procedureUsage.count({ where: { appointmentId } });
    expect(usages).toBe(0);
  });

  it("bloqueia transição a partir de estado terminal", async () => {
    const appointmentId = await createConfirmedAppointment();

    await setSessionForEmail("dra.helena@bibi.health");
    const done = await patchStatus(appointmentId, "REALIZADO");
    expect(done.status).toBe(200);

    const reopen = await patchStatus(appointmentId, "CANCELADO");
    expect(reopen.status).toBe(409);

    const prisma = getTestPrisma();
    const appointment = await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId } });
    expect(appointment.status).toBe("REALIZADO");
  });

  it("permite fluxo válido CONFIRMADO → REALIZADO com procedimento", async () => {
    const prisma = getTestPrisma();
    const appointmentId = await createConfirmedAppointment();
    const procedure = await prisma.procedure.findFirstOrThrow({ where: { code: "CON-CLM" } });

    await setSessionForEmail("dra.helena@bibi.health");
    const proc = await registerProcedure(appointmentId, procedure.id);
    expect(proc.status).toBe(200);

    const done = await patchStatus(appointmentId, "REALIZADO");
    expect(done.status).toBe(200);
  });
});
