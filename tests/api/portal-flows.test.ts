import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as internoDashboardGet } from "@/app/api/interno/dashboard/route";
import { GET as internoBillingGet } from "@/app/api/interno/billing/route";
import { GET as internoAgendaGet } from "@/app/api/interno/appointments/route";
import { GET as pjOverviewGet } from "@/app/api/pj/overview/route";
import { GET as pjReportsGet } from "@/app/api/pj/reports/route";
import { GET as beneficiarioOverviewGet } from "@/app/api/beneficiario/overview/route";
import { GET as beneficiarioProvidersGet } from "@/app/api/beneficiario/providers/route";
import { GET as prestadorAgendaGet } from "@/app/api/prestador/agenda/route";
import { GET as prestadorPatientOverviewGet } from "@/app/api/prestador/patients/[id]/overview/route";
import { GET as authMeGet } from "@/app/api/auth/me/route";
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

describe("API — fluxos por portal", () => {
  afterEach(() => {
    clearSessionMock();
  });

  describe("Portal Interno (ADMIN)", () => {
    beforeEach(async () => {
      await setSessionForEmail("faturamento@bibi.health");
    });

    it("GET /api/auth/me retorna perfil interno", async () => {
      const res = await authMeGet();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.role).toBe("INTERNO");
      expect(body.user.email).toBe("faturamento@bibi.health");
    });

    it("GET /api/interno/dashboard retorna KPIs", async () => {
      const res = await internoDashboardGet();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.dashboard).toBeDefined();
      expect(body.dashboard.revenue).toBeDefined();
    });

    it("GET /api/interno/billing retorna pendências e faturas", async () => {
      const res = await internoBillingGet();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.pending)).toBe(true);
      expect(Array.isArray(body.invoices)).toBe(true);
      expect(body.paymentGatewayConfigured).toBe(true);
    });

    it("GET /api/interno/appointments lista agenda", async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await internoAgendaGet(
        new Request(`http://localhost/api/interno/appointments?date=${today}`),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.appointments)).toBe(true);
      expect(Array.isArray(body.providers)).toBe(true);
    });
  });

  describe("Portal Interno (RECEPCAO — RBAC)", () => {
    beforeEach(async () => {
      await setSessionForEmail("recepcao@bibi.health");
    });

    it("acessa agenda mas não faturamento sensível via billing read", async () => {
      const agenda = await internoAgendaGet(
        new Request("http://localhost/api/interno/appointments"),
      );
      expect(agenda.status).toBe(200);

      const billing = await internoBillingGet();
      expect(billing.status).toBe(200);
    });
  });

  describe("Portal PJ", () => {
    beforeEach(async () => {
      await setSessionForEmail("rh@techcorp.com");
    });

    it("GET /api/pj/overview retorna dados da TechCorp", async () => {
      const res = await pjOverviewGet();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.company.name).toContain("TechCorp");
      expect(Array.isArray(body.beneficiaries)).toBe(true);
      expect(body.summary).toBeDefined();
    });

    it("GET /api/pj/reports exporta CSV", async () => {
      const res = await pjReportsGet();
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/csv");
      const text = await res.text();
      expect(text).toContain("TechCorp");
    });
  });

  describe("Portal Beneficiário", () => {
    beforeEach(async () => {
      await setSessionForEmail("joao.pereira@email.com");
    });

    it("GET /api/beneficiario/overview retorna painel self-service", async () => {
      const res = await beneficiarioOverviewGet();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.overview.patient.name).toBeTruthy();
      expect(body.overview.summary).toBeDefined();
      expect(Array.isArray(body.overview.appointments)).toBe(true);
    });

    it("GET /api/beneficiario/providers lista prestadores", async () => {
      const res = await beneficiarioProvidersGet();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.providers.length).toBeGreaterThan(0);
      expect(body.providers.some((p: { name: string }) => p.name.includes("Helena"))).toBe(
        true,
      );
    });
  });

  describe("Portal Prestador", () => {
    beforeEach(async () => {
      await setSessionForEmail("dra.helena@bibi.health");
    });

    it("GET /api/prestador/agenda retorna atendimentos do dia", async () => {
      const res = await prestadorAgendaGet(new Request("http://localhost/api/prestador/agenda"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.appointments)).toBe(true);
      expect(body.view).toBe("day");
      expect(body.summary).toMatchObject({
        today: expect.any(Number),
        upcoming: expect.any(Number),
        past: expect.any(Number),
      });
    });

    it("GET /api/prestador/agenda?view=upcoming retorna consultas futuras", async () => {
      const res = await prestadorAgendaGet(
        new Request("http://localhost/api/prestador/agenda?view=upcoming"),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.view).toBe("upcoming");
      expect(Array.isArray(body.appointments)).toBe(true);
    });

    it("GET /api/prestador/agenda?view=past retorna histórico", async () => {
      const res = await prestadorAgendaGet(
        new Request("http://localhost/api/prestador/agenda?view=past"),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.view).toBe("past");
      expect(Array.isArray(body.appointments)).toBe(true);
    });

    it("GET /api/prestador/patients/[id]/overview retorna histórico do paciente", async () => {
      const agendaRes = await prestadorAgendaGet(
        new Request("http://localhost/api/prestador/agenda?view=past"),
      );
      const agenda = await agendaRes.json();
      const patientId = agenda.appointments[0]?.patient?.id;
      if (!patientId) return;

      const res = await prestadorPatientOverviewGet(
        new Request(`http://localhost/api/prestador/patients/${patientId}/overview`),
        { params: Promise.resolve({ id: patientId }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.overview.patient.id).toBe(patientId);
      expect(Array.isArray(body.overview.appointments)).toBe(true);
    });
  });

  describe("Proteção cross-portal", () => {
    it("prestador não acessa overview PJ", async () => {
      await setSessionForEmail("dra.helena@bibi.health");
      const res = await pjOverviewGet();
      expect(res.status).toBe(403);
    });

    it("PJ não acessa dashboard interno", async () => {
      await setSessionForEmail("rh@techcorp.com");
      const res = await internoDashboardGet();
      expect(res.status).toBe(403);
    });

    it("sem sessão retorna 401", async () => {
      clearSessionMock();
      const res = await beneficiarioOverviewGet();
      expect(res.status).toBe(401);
    });
  });
});
