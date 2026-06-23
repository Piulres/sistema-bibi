import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as voaSessionGet } from "@/app/api/prestador/appointments/[id]/voa/route";
import { POST as voaImportPost } from "@/app/api/prestador/appointments/[id]/voa/import/route";
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

describe("Voa Health — APIs", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env, VOA_ENABLED: "true" };
  });

  afterEach(() => {
    process.env = env;
    clearSessionMock();
  });

  it("GET /voa retorna mount config para prestador", async () => {
    const prisma = getTestPrisma();
    const provider = await prisma.user.findUniqueOrThrow({
      where: { email: "dra.helena@bibi.health" },
    });
    const appointment = await prisma.appointment.findFirst({
      where: { providerId: provider.id },
    });
    expect(appointment).toBeTruthy();

    await setSessionForEmail("dra.helena@bibi.health");
    const res = await voaSessionGet(new Request("http://localhost"), {
      params: Promise.resolve({ id: appointment!.id }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.mount.doctorId).toBe(provider.id);
    expect(data.mount.patientId).toBe(appointment!.patientId);
    expect(data.mount.consultationId).toBe(appointment!.id);
    expect(data.mount.options.enableFillEhr).toBe(true);
  });

  it("POST /voa/import cria MedicalRecord e timeline", async () => {
    const prisma = getTestPrisma();
    const provider = await prisma.user.findUniqueOrThrow({
      where: { email: "dra.helena@bibi.health" },
    });
    const appointment = await prisma.appointment.findFirst({
      where: { providerId: provider.id },
      include: { patient: true },
    });
    expect(appointment).toBeTruthy();

    const beforeCount = await prisma.medicalRecord.count({
      where: { appointmentId: appointment!.id },
    });

    await setSessionForEmail("dra.helena@bibi.health");
    const res = await voaImportPost(
      jsonRequest(`http://localhost/api/prestador/appointments/${appointment!.id}/voa/import`, {
        method: "POST",
        body: {
          patientId: appointment!.patientId,
          document: "# Anamnese Voa (teste)\n\nQueixa principal: cefaleia.",
          templateName: "Anamnese padrão",
          templateSlug: "anamnese-padrao",
        },
      }),
      { params: Promise.resolve({ id: appointment!.id }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.record.id).toBeTruthy();
    expect(data.record.recordType).toBe("ANAMNESE");

    const afterCount = await prisma.medicalRecord.count({
      where: { appointmentId: appointment!.id },
    });
    expect(afterCount).toBe(beforeCount + 1);

    const timeline = await prisma.timelineEvent.findFirst({
      where: {
        entityId: data.record.id,
        action: "VOA_DOCUMENT_IMPORTED",
      },
    });
    expect(timeline).toBeTruthy();
  });

  it("POST /voa/import retorna 503 quando VOA_ENABLED=false", async () => {
    process.env.VOA_ENABLED = "false";
    const prisma = getTestPrisma();
    const appointment = await prisma.appointment.findFirst();
    expect(appointment).toBeTruthy();

    await setSessionForEmail("dra.helena@bibi.health");
    const res = await voaImportPost(
      jsonRequest("http://localhost/import", {
        method: "POST",
        body: { patientId: appointment!.patientId, document: "teste" },
      }),
      { params: Promise.resolve({ id: appointment!.id }) },
    );
    expect(res.status).toBe(503);
  });
});
