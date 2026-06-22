import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as auditExportGet } from "@/app/api/interno/audit/export/route";
import { GET as billingExportGet } from "@/app/api/interno/billing/export/route";
import { GET as subscriptionsExportGet } from "@/app/api/interno/subscriptions/export/route";
import { GET as internoReportsGet } from "@/app/api/interno/reports/route";
import { GET as patientExportGet } from "@/app/api/interno/patients/[id]/export/route";
import { GET as prestadorExtratoExportGet } from "@/app/api/prestador/extrato/export/route";
import { GET as prestadorReportsGet } from "@/app/api/prestador/reports/route";
import { GET as beneficiarioExportGet } from "@/app/api/beneficiario/export/route";
import { GET as pjReportsGet } from "@/app/api/pj/reports/route";
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

describe("API — exportações PDF/Excel", () => {
  afterEach(() => {
    clearSessionMock();
  });

  describe("Interno", () => {
    beforeEach(async () => {
      await setSessionForEmail("faturamento@bibi.health");
    });

    it("GET /api/interno/audit/export retorna XLSX", async () => {
      const res = await auditExportGet(
        new Request("http://localhost/api/interno/audit/export?format=xlsx"),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("spreadsheetml");
      expect(res.headers.get("content-disposition")).toContain("auditoria.xlsx");
    });

    it("GET /api/interno/billing/export retorna PDF", async () => {
      const res = await billingExportGet(
        new Request("http://localhost/api/interno/billing/export?format=pdf"),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
    });

    it("GET /api/interno/subscriptions/export retorna XLSX", async () => {
      const res = await subscriptionsExportGet(
        new Request("http://localhost/api/interno/subscriptions/export?format=xlsx"),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("spreadsheetml");
    });

    it("GET /api/interno/reports?format=pdf retorna PDF de faturamento", async () => {
      const res = await internoReportsGet(
        new Request("http://localhost/api/interno/reports?type=billing&format=pdf"),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
    });

    it("GET /api/interno/reports mantém CSV como padrão", async () => {
      const res = await internoReportsGet(
        new Request("http://localhost/api/interno/reports?type=billing"),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/csv");
    });
  });

  describe("Cliente 360°", () => {
    beforeEach(async () => {
      await setSessionForEmail("faturamento@bibi.health");
    });

    it("GET export paciente inexistente retorna 404", async () => {
      const res = await patientExportGet(
        new Request(
          "http://localhost/api/interno/patients/nonexistent/export?section=timeline&format=pdf",
        ),
        { params: Promise.resolve({ id: "nonexistent" }) },
      );
      expect(res.status).toBe(404);
    });
  });

  describe("Prestador", () => {
    beforeEach(async () => {
      await setSessionForEmail("dra.helena@bibi.health");
    });

    it("GET /api/prestador/extrato/export retorna XLSX", async () => {
      const res = await prestadorExtratoExportGet(
        new Request("http://localhost/api/prestador/extrato/export?format=xlsx"),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("spreadsheetml");
    });

    it("GET /api/prestador/reports?format=pdf retorna PDF", async () => {
      const res = await prestadorReportsGet(
        new Request("http://localhost/api/prestador/reports?type=procedures&format=pdf"),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
    });
  });

  describe("Beneficiário", () => {
    beforeEach(async () => {
      await setSessionForEmail("joao.pereira@email.com");
    });

    it("GET /api/beneficiario/export retorna PDF do consumo", async () => {
      const res = await beneficiarioExportGet(
        new Request("http://localhost/api/beneficiario/export?section=consumo&format=pdf"),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
    });
  });

  describe("PJ", () => {
    beforeEach(async () => {
      await setSessionForEmail("rh@techcorp.com");
    });

    it("GET /api/pj/reports?format=xlsx retorna Excel", async () => {
      const res = await pjReportsGet(
        new Request("http://localhost/api/pj/reports?format=xlsx"),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("spreadsheetml");
    });
  });
});
