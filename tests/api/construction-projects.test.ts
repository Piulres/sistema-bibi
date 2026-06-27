import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as internoProjectsGet } from "@/app/api/interno/projects/route";
import { GET as internoProjectGet } from "@/app/api/interno/projects/[id]/route";
import { POST as internoBudgetsPost } from "@/app/api/interno/projects/[id]/budgets/route";
import { GET as internoBudgetPdfGet } from "@/app/api/interno/projects/[id]/budgets/[budgetId]/pdf/route";
import { GET as pjProjectsGet } from "@/app/api/pj/projects/route";
import { GET as pjProjectGet } from "@/app/api/pj/projects/[id]/route";
import { POST as pjBudgetsPost } from "@/app/api/pj/projects/[id]/budgets/route";
import { GET as pjBudgetPdfGet } from "@/app/api/pj/projects/[id]/budgets/[budgetId]/pdf/route";
import { GET as pjOverviewGet } from "@/app/api/pj/overview/route";
import {
  clearSessionMock,
  sessionMockState,
  setSessionForEmail,
} from "../helpers/session-mock";
import { DEMO_EMAILS } from "../helpers/seed-fixtures";
import { getTestPrisma } from "../helpers/db";

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

async function getBuildProject(code: string) {
  const prisma = getTestPrisma();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: "build" } });
  return prisma.project.findFirstOrThrow({
    where: { tenantId: tenant.id, code },
    include: { budgets: true },
  });
}

describe("API — Obras CONSTRUCTION", () => {
  afterEach(() => {
    clearSessionMock();
  });

  describe("Portal interno (Build Engenharia)", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.buildInterno);
    });

    it("GET /api/interno/projects lista obras do tenant build", async () => {
      const res = await internoProjectsGet(new Request("http://localhost/api/interno/projects"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.projects.length).toBeGreaterThanOrEqual(3);
      expect(body.projects.some((p: { code: string }) => p.code === "OBR-2026-001")).toBe(true);
    });

    it("GET /api/interno/projects?view=pipeline retorna colunas Kanban", async () => {
      const res = await internoProjectsGet(
        new Request("http://localhost/api/interno/projects?view=pipeline"),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pipeline).toBeDefined();
      expect(Array.isArray(body.pipeline.EM_OBRA)).toBe(true);
    });

    it("GET /api/interno/projects/[id] retorna detalhe com orçamento e tarefas", async () => {
      const project = await getBuildProject("OBR-2026-001");
      const res = await internoProjectGet(
        new Request(`http://localhost/api/interno/projects/${project.id}`),
        { params: Promise.resolve({ id: project.id }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.project.code).toBe("OBR-2026-001");
      expect(body.project.budgets.length).toBeGreaterThan(0);
      expect(body.project.tasks.length).toBeGreaterThanOrEqual(4);
      expect(body.project.tasks.some((t: { dependsOnName: string | null }) => t.dependsOnName)).toBe(
        true,
      );
    });

    it("obra aprovada no seed tem invoiceId", async () => {
      const project = await getBuildProject("OBR-2026-001");
      const approved = project.budgets.find((b) => b.status === "APROVADO");
      expect(approved?.invoiceId).toBeTruthy();
    });

    it("GET PDF do orçamento retorna application/pdf", async () => {
      const project = await getBuildProject("OBR-2026-003");
      const budget = project.budgets[0];
      const res = await internoBudgetPdfGet(
        new Request(
          `http://localhost/api/interno/projects/${project.id}/budgets/${budget.id}/pdf`,
        ),
        { params: Promise.resolve({ id: project.id, budgetId: budget.id }) },
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
      const buf = Buffer.from(await res.arrayBuffer());
      expect(buf.subarray(0, 4).toString()).toBe("%PDF");
    });

    it("POST reject recusa proposta enviada (interno)", async () => {
      const prisma = getTestPrisma();
      const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: "build" } });
      const project = await prisma.project.create({
        data: {
          tenantId: tenant.id,
          code: `OBR-TEST-${Date.now()}`,
          name: "Obra teste reject",
          status: "PROPOSTA",
          budgets: {
            create: {
              version: 1,
              status: "ENVIADO",
              subtotal: 1000,
              total: 1000,
              sentAt: new Date(),
            },
          },
        },
        include: { budgets: true },
      });

      const res = await internoBudgetsPost(
        new Request(`http://localhost/api/interno/projects/${project.id}/budgets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject", budgetId: project.budgets[0].id }),
        }),
        { params: Promise.resolve({ id: project.id }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.budget.status).toBe("REJEITADO");
    });
  });

  describe("Portal PJ (Incorp Alpha)", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.buildPj);
    });

    it("GET /api/pj/projects lista só obras da empresa", async () => {
      const res = await pjProjectsGet();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.projects.length).toBeGreaterThanOrEqual(3);
      expect(body.projects.every((p: { code: string }) => p.code.startsWith("OBR-"))).toBe(true);
    });

    it("GET /api/pj/projects/[id] retorna anexos com URL PJ", async () => {
      const project = await getBuildProject("OBR-2026-002");
      const res = await pjProjectGet(
        new Request(`http://localhost/api/pj/projects/${project.id}`),
        { params: Promise.resolve({ id: project.id }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.project.attachments[0]?.downloadUrl).toContain("/api/pj/attachments/");
    });

    it("GET /api/pj/overview alerta propostas pendentes", async () => {
      const res = await pjOverviewGet();
      expect(res.status).toBe(200);
      const body = await res.json();
      const obraAlert = body.alerts.find((a: { href?: string }) => a.href === "/pj/projetos");
      expect(obraAlert).toBeDefined();
      expect(obraAlert.message).toMatch(/proposta/i);
    });

    it("POST approve emite fatura quando orçamento ENVIADO", async () => {
      const project = await getBuildProject("OBR-2026-002");
      const budget = project.budgets.find((b) => b.status === "ENVIADO");
      if (!budget) {
        expect(project.budgets.some((b) => b.status === "APROVADO")).toBe(true);
        return;
      }

      const prisma = getTestPrisma();
      const before = await prisma.invoice.count();

      const res = await pjBudgetsPost(
        new Request(`http://localhost/api/pj/projects/${project.id}/budgets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve", budgetId: budget.id }),
        }),
        { params: Promise.resolve({ id: project.id }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.invoiceId).toBeTruthy();
      expect(body.budget.status).toBe("APROVADO");

      const after = await prisma.invoice.count();
      expect(after).toBe(before + 1);
    });

    it("GET PDF proposta PJ retorna PDF", async () => {
      const project = await getBuildProject("OBR-2026-002");
      const budget = project.budgets[0];
      const res = await pjBudgetPdfGet(
        new Request(
          `http://localhost/api/pj/projects/${project.id}/budgets/${budget.id}/pdf`,
        ),
        { params: Promise.resolve({ id: project.id, budgetId: budget.id }) },
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
    });

    it("GET field-reports lista RDO da obra", async () => {
      await setSessionForEmail(DEMO_EMAILS.buildInterno);
      const project = await getBuildProject("OBR-2026-001");
      const { GET } = await import("@/app/api/interno/projects/[id]/field-reports/route");
      const res = await GET(
        new Request(`http://localhost/api/interno/projects/${project.id}/field-reports`),
        { params: Promise.resolve({ id: project.id }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.reports.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Portal prestador campo", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.buildPedreiro);
    });

    it("GET /api/prestador/campo/projects lista obras alocadas", async () => {
      const { GET } = await import("@/app/api/prestador/campo/projects/route");
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.projects.some((p: { code: string }) => p.code === "OBR-2026-001")).toBe(true);
    });

    it("GET /api/prestador/campo/projects inclui diária da alocação", async () => {
      const { GET } = await import("@/app/api/prestador/campo/projects/route");
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      const obra = body.projects.find((p: { code: string }) => p.code === "OBR-2026-001");
      expect(obra?.dailyRate).toBe(280);
    });

    it("POST field-report registra diária", async () => {
      const project = await getBuildProject("OBR-2026-001");
      const { POST } = await import("@/app/api/prestador/field-reports/route");
      const res = await POST(
        new Request("http://localhost/api/prestador/field-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            reportDate: new Date().toISOString().slice(0, 10),
            trade: "PEDREIRO",
            workDone: "Teste homologação — assentamento de piso",
            diariaAmount: 280,
          }),
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.report.workDone).toContain("homologação");
    });
  });

  describe("Portal beneficiário (cliente obra)", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.buildCliente);
    });

    it("GET /api/beneficiario/projects lista obras da empresa", async () => {
      const { GET } = await import("@/app/api/beneficiario/projects/route");
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.projects.some((p: { code: string }) => p.code === "OBR-2026-001")).toBe(true);
    });

    it("GET /api/beneficiario/projects/[id] retorna detalhe da obra", async () => {
      const project = await getBuildProject("OBR-2026-001");
      const { GET } = await import("@/app/api/beneficiario/projects/[id]/route");
      const res = await GET(
        new Request(`http://localhost/api/beneficiario/projects/${project.id}`),
        { params: Promise.resolve({ id: project.id }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.project.code).toBe("OBR-2026-001");
      expect(body.project.tasks.length).toBeGreaterThan(0);
    });
  });

  describe("Isolamento entre segmentos", () => {
    it("interno MEDICAL não vê obras do build", async () => {
      await setSessionForEmail(DEMO_EMAILS.internoAdmin);
      const res = await internoProjectsGet(new Request("http://localhost/api/interno/projects"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.projects).toEqual([]);
    });

    it("PJ TechCorp não acessa obras do build", async () => {
      await setSessionForEmail(DEMO_EMAILS.pjTechcorp);
      const res = await pjProjectsGet();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.projects).toEqual([]);
    });

    it("PJ TechCorp não vê alerta de obras CONSTRUCTION", async () => {
      await setSessionForEmail(DEMO_EMAILS.pjTechcorp);
      const res = await pjOverviewGet();
      const body = await res.json();
      const obraAlert = body.alerts.find((a: { href?: string }) => a.href === "/pj/projetos");
      expect(obraAlert).toBeUndefined();
    });

    it("PJ build não acessa obra de outro tenant (404)", async () => {
      await setSessionForEmail(DEMO_EMAILS.buildPj);
      const res = await pjProjectGet(
        new Request("http://localhost/api/pj/projects/invalid-id"),
        { params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000099" }) },
      );
      expect(res.status).toBe(404);
    });
  });
});
