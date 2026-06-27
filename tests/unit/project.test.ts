import { describe, expect, it } from "vitest";
import {
  isProjectStatus,
  projectStatusLabel,
  isBudgetStatus,
  budgetStatusLabel,
  isAttachmentCategory,
} from "@/lib/project/constants";
import { NICHE_MASTER_LABELS } from "@/constants/niches";

describe("project.constants", () => {
  it("valida status de obra", () => {
    expect(isProjectStatus("EM_OBRA")).toBe(true);
    expect(isProjectStatus("INVALID")).toBe(false);
    expect(projectStatusLabel("PROPOSTA")).toBe("Proposta");
  });

  it("valida status de orçamento", () => {
    expect(isBudgetStatus("ENVIADO")).toBe(true);
    expect(budgetStatusLabel("RASCUNHO")).toBe("Rascunho");
  });

  it("valida categorias de anexo", () => {
    expect(isAttachmentCategory("PLANTA")).toBe(true);
    expect(isAttachmentCategory("X")).toBe(false);
  });
});

describe("CONSTRUCTION niche labels", () => {
  it("define glossário Engenharia Civil", () => {
    expect(NICHE_MASTER_LABELS.CONSTRUCTION.patient).toBe("Obra");
    expect(NICHE_MASTER_LABELS.CONSTRUCTION.medicalRecord).toBe("Diário de obra");
    expect(NICHE_MASTER_LABELS.CONSTRUCTION.appointment).toBe("Diária");
    expect(NICHE_MASTER_LABELS.CONSTRUCTION.portalProvider).toBe("Portal de Campo");
  });
});

describe("isolamento CONSTRUCTION vs outros nichos", () => {
  it("nav interno só inclui Obras em CONSTRUCTION", async () => {
    const { buildInternoNavTabs, buildPjSectionNav } = await import("@/lib/navigation/niche-nav");
    const { NICHE_MASTER_LABELS } = await import("@/constants/niches");

    const medicalNav = buildInternoNavTabs(NICHE_MASTER_LABELS.MEDICAL, "MEDICAL");
    expect(medicalNav.some((t) => t.key === "projetos")).toBe(false);

    const buildNav = buildInternoNavTabs(NICHE_MASTER_LABELS.CONSTRUCTION, "CONSTRUCTION");
    expect(buildNav.some((t) => t.key === "projetos")).toBe(true);
    expect(buildNav.find((t) => t.key === "projetos")?.label).toBe("Obras");

    const medicalPj = buildPjSectionNav(NICHE_MASTER_LABELS.MEDICAL, "MEDICAL");
    expect(medicalPj.some((s) => s.href === "/pj/projetos")).toBe(false);

    const buildPj = buildPjSectionNav(NICHE_MASTER_LABELS.CONSTRUCTION, "CONSTRUCTION");
    expect(buildPj.some((s) => s.href === "/pj/projetos")).toBe(true);

    const { buildBeneficiarioNavTabs } = await import("@/lib/navigation/niche-nav");
    const buildBenef = buildBeneficiarioNavTabs(NICHE_MASTER_LABELS.CONSTRUCTION, "CONSTRUCTION");
    expect(buildBenef.some((t) => t.key === "obras")).toBe(true);
    expect(buildBenef.some((t) => t.key === "medicacoes")).toBe(false);
    expect(buildBenef.some((t) => t.key === "agendar")).toBe(false);
  });
});

describe("project-service (CONSTRUCTION seed)", () => {
  it("lista obras da empresa PJ Incorp Alpha", async () => {
    const { getTestPrisma } = await import("../helpers/db");
    const { listProjectsForCompany } = await import("@/lib/project/project-service");
    const prisma = getTestPrisma();

    const tenant = await prisma.tenant.findUnique({ where: { slug: "build" } });
    const company = await prisma.company.findFirst({
      where: { tenantId: tenant!.id, name: "Incorp Alpha" },
    });
    expect(company).toBeTruthy();

    const projects = await listProjectsForCompany(tenant!.id, company!.id);
    expect(projects.length).toBeGreaterThanOrEqual(2);
    expect(projects.some((p) => p.code === "OBR-2026-002")).toBe(true);
  });

  it("aprova orçamento enviado após aprovação PJ e emite fatura", async () => {
    const { getTestPrisma } = await import("../helpers/db");
    const { approveBudget, approveBudgetByPj } = await import("@/lib/project/project-service");
    const prisma = getTestPrisma();

    const tenant = await prisma.tenant.findUnique({ where: { slug: "build" } });
    const admin = await prisma.user.findFirst({
      where: { tenantId: tenant!.id, email: "operacao@build.demo" },
    });
    const pjUser = await prisma.user.findFirst({
      where: { tenantId: tenant!.id, email: "rh@incorp.demo" },
    });
    const project = await prisma.project.findFirst({
      where: { tenantId: tenant!.id, code: "OBR-2026-002" },
      include: { budgets: true },
    });
    const budget = project!.budgets.find((b) => b.status === "ENVIADO" || b.status === "APROVADO_PJ");
    if (!budget) {
      const approved = project!.budgets.find((b) => b.status === "APROVADO");
      expect(approved?.invoiceId).toBeTruthy();
      return;
    }

    if (budget.status === "ENVIADO" && pjUser) {
      const pjStep = await approveBudgetByPj({
        tenantId: tenant!.id,
        projectId: project!.id,
        budgetId: budget.id,
        updatedBy: pjUser.id,
        approvedByPjUserId: pjUser.id,
      });
      expect("error" in pjStep).toBe(false);
    }

    const beforeInvoices = await prisma.invoice.count({ where: { tenantId: tenant!.id } });

    const result = await approveBudget({
      tenantId: tenant!.id,
      projectId: project!.id,
      budgetId: budget!.id,
      updatedBy: admin!.id,
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.invoiceId).toBeTruthy();
    expect(result.budget.status).toBe("APROVADO");

    const afterInvoices = await prisma.invoice.count({ where: { tenantId: tenant!.id } });
    expect(afterInvoices).toBe(beforeInvoices + 1);
  });

  it("bloqueia faturamento interno sem aprovação PJ quando há empresa", async () => {
    const { getTestPrisma } = await import("../helpers/db");
    const { approveBudget } = await import("@/lib/project/project-service");
    const prisma = getTestPrisma();

    const tenant = await prisma.tenant.findUnique({ where: { slug: "build" } });
    const admin = await prisma.user.findFirst({
      where: { tenantId: tenant!.id, email: "operacao@build.demo" },
    });
    const project = await prisma.project.findFirst({
      where: { tenantId: tenant!.id, code: "OBR-2026-002" },
      include: { budgets: true, company: true },
    });
    const budget = project!.budgets.find((b) => b.status === "ENVIADO");
    if (!budget || !project!.companyId) return;

    const result = await approveBudget({
      tenantId: tenant!.id,
      projectId: project!.id,
      budgetId: budget.id,
      updatedBy: admin!.id,
    });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toMatch(/cliente/i);
    }
  });

  it("gera dados para PDF de orçamento", async () => {
    const { getTestPrisma } = await import("../helpers/db");
    const { getBudgetPdfData } = await import("@/lib/project/project-service");
    const { buildBudgetPdfBuffer } = await import("@/lib/exports/budget-pdf");
    const prisma = getTestPrisma();

    const tenant = await prisma.tenant.findUnique({ where: { slug: "build" } });
    const project = await prisma.project.findFirst({
      where: { tenantId: tenant!.id, code: "OBR-2026-003" },
      include: { budgets: true },
    });
    const budget = project!.budgets[0];

    const data = await getBudgetPdfData(tenant!.id, project!.id, budget.id);
    expect(data).toBeTruthy();
    expect(data!.project.code).toBe("OBR-2026-003");

    const buffer = await buildBudgetPdfBuffer(data!);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("obra aprovada no seed tem fatura vinculada", async () => {
    const { getTestPrisma } = await import("../helpers/db");
    const prisma = getTestPrisma();
    const tenant = await prisma.tenant.findUnique({ where: { slug: "build" } });
    const project = await prisma.project.findFirst({
      where: { tenantId: tenant!.id, code: "OBR-2026-001" },
      include: { budgets: true },
    });
    const approved = project!.budgets.find((b) => b.status === "APROVADO");
    expect(approved?.invoiceId).toBeTruthy();
  });

  it("PJ acessa obra da própria empresa", async () => {
    const { getTestPrisma } = await import("../helpers/db");
    const { getProjectForCompany } = await import("@/lib/project/project-service");
    const prisma = getTestPrisma();

    const tenant = await prisma.tenant.findUnique({ where: { slug: "build" } });
    const company = await prisma.company.findFirst({
      where: { tenantId: tenant!.id, name: "Incorp Alpha" },
    });
    const project = await prisma.project.findFirst({
      where: { tenantId: tenant!.id, code: "OBR-2026-001" },
    });

    const detail = await getProjectForCompany(tenant!.id, company!.id, project!.id);
    expect(detail).toBeTruthy();
    expect(detail!.attachments[0]?.downloadUrl).toContain("/api/pj/attachments/");
  });
});
