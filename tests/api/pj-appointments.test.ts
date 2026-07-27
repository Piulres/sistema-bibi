import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as pjAppointmentsPost } from "@/app/api/pj/appointments/route";
import { GET as pjProvidersGet } from "@/app/api/pj/providers/route";
import { GET as pjSlotsGet } from "@/app/api/pj/slots/route";
import { getAvailableSlots } from "@/lib/scheduling-service";
import { civilDateISO } from "@/lib/timezone";
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

describe("POST /api/pj/appointments — RH agenda em nome do colaborador da empresa", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("cria CONFIRMADO para beneficiário da TechCorp e enfileira APPOINTMENT_CONFIRMATION (sem recepção)", async () => {
    const prisma = getTestPrisma();
    const rh = await prisma.user.findUniqueOrThrow({
      where: { email: "rh@techcorp.com" },
    });
    expect(rh.companyId).toBeTruthy();

    const patient = await prisma.patient.findFirstOrThrow({
      where: { companyId: rh.companyId!, name: { contains: "João Pereira" } },
    });
    const provider = await prisma.user.findUniqueOrThrow({
      where: { email: "dra.helena@bibi.health" },
    });

    let booked: { start: string } | null = null;
    for (let day = 14; day < 40 && !booked; day += 1) {
      const probe = new Date();
      probe.setDate(probe.getDate() + day);
      const { slots } = await getAvailableSlots({
        tenantId: rh.tenantId,
        providerId: provider.id,
        date: probe,
      });
      if (slots[0]) booked = { start: slots[0].start };
    }
    expect(booked).toBeTruthy();

    await setSessionForEmail("rh@techcorp.com");
    const res = await pjAppointmentsPost(
      jsonRequest("http://localhost/api/pj/appointments", {
        method: "POST",
        body: {
          patientId: patient.id,
          providerId: provider.id,
          scheduledAt: booked!.start,
          reason: "Check-up ocupacional",
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.appointment.status).toBe("CONFIRMADO");
    expect(body.appointment.patientId).toBe(patient.id);

    const message = await prisma.message.findFirst({
      where: {
        tenantId: rh.tenantId,
        template: "APPOINTMENT_CONFIRMATION",
        patientId: patient.id,
      },
      orderBy: { createdAt: "desc" },
    });
    expect(message).toBeTruthy();
  });

  it("rejeita patientId de outra empresa no mesmo tenant (anti-IDOR B2B)", async () => {
    const prisma = getTestPrisma();
    const rh = await prisma.user.findUniqueOrThrow({
      where: { email: "rh@techcorp.com" },
    });
    const other = await prisma.patient.findFirstOrThrow({
      where: {
        tenantId: rh.tenantId,
        companyId: { not: rh.companyId },
      },
    });
    const provider = await prisma.user.findUniqueOrThrow({
      where: { email: "dra.helena@bibi.health" },
    });

    await setSessionForEmail("rh@techcorp.com");
    const res = await pjAppointmentsPost(
      jsonRequest("http://localhost/api/pj/appointments", {
        method: "POST",
        body: {
          patientId: other.id,
          providerId: provider.id,
          scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString(),
        },
      }),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(String(body.error)).toMatch(/não encontrado/i);
  });

  it("rejeita patientId particular (companyId null) para não misturar walk-in com corporativo", async () => {
    const prisma = getTestPrisma();
    const rh = await prisma.user.findUniqueOrThrow({
      where: { email: "rh@techcorp.com" },
    });
    const particular = await prisma.patient.findFirstOrThrow({
      where: { tenantId: rh.tenantId, companyId: null },
    });
    const provider = await prisma.user.findUniqueOrThrow({
      where: { email: "dra.helena@bibi.health" },
    });

    await setSessionForEmail("rh@techcorp.com");
    const res = await pjAppointmentsPost(
      jsonRequest("http://localhost/api/pj/appointments", {
        method: "POST",
        body: {
          patientId: particular.id,
          providerId: provider.id,
          scheduledAt: new Date(Date.now() + 8 * 24 * 60 * 60_000).toISOString(),
        },
      }),
    );
    expect(res.status).toBe(404);
  });

  it("retorna 403 para sessão BENEFICIARIO (isolamento de portal)", async () => {
    await setSessionForEmail("joao.pereira@email.com");
    const res = await pjAppointmentsPost(
      jsonRequest("http://localhost/api/pj/appointments", {
        method: "POST",
        body: {
          patientId: "x",
          providerId: "y",
          scheduledAt: new Date().toISOString(),
        },
      }),
    );
    expect(res.status).toBe(403);
  });
});

describe("GET /api/pj/slots e providers — horários usados pelo RH sem impersonar beneficiário", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("lista prestadores do tenant para sessão PJ autenticada", async () => {
    await setSessionForEmail("rh@techcorp.com");
    const res = await pjProvidersGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.providers.length).toBeGreaterThan(0);
    expect(body.providers.some((p: { name: string }) => p.name.includes("Helena"))).toBe(true);
  });

  it("lista slots do prestador no dia civil BRT para sessão PJ autenticada", async () => {
    const prisma = getTestPrisma();
    const provider = await prisma.user.findUniqueOrThrow({
      where: { email: "dra.helena@bibi.health" },
    });
    const date = civilDateISO(new Date(Date.now() + 21 * 24 * 60 * 60_000));
    await setSessionForEmail("rh@techcorp.com");
    const res = await pjSlotsGet(
      new Request(
        `http://localhost/api/pj/slots?providerId=${provider.id}&date=${date}`,
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.slots)).toBe(true);
  });
});
