import { describe, expect, it } from "vitest";
import { getTestPrisma } from "../helpers/db";
import { DEMO_EMAILS } from "../helpers/seed-fixtures";
import { NICHE_IDS } from "@/lib/niche/types";

const DEMO_TENANT_SLUGS = ["horizonte", "vitacare", "petcare", "smile", "lex", "zen", "eduprime", "build"] as const;

describe("Massa demo — cobertura por portal", () => {
  const prisma = getTestPrisma();

  describe("Interno (role INTERNO)", () => {
    it("tenant Horizonte com perfis RBAC ADMIN, FATURAMENTO, RECEPCAO e MFA", async () => {
      const horizonte = await prisma.tenant.findFirstOrThrow({ where: { slug: "horizonte" } });
      const internos = await prisma.user.findMany({
        where: { tenantId: horizonte.id, role: "INTERNO" },
        select: { email: true, internoProfile: true, mfaEnabled: true },
      });
      expect(internos.length).toBeGreaterThanOrEqual(4);
      expect(internos.map((u) => u.internoProfile)).toEqual(
        expect.arrayContaining(["ADMIN", "FATURAMENTO", "RECEPCAO"]),
      );
      expect(internos.some((u) => u.mfaEnabled)).toBe(true);
    });

    it("cadastros base: empresas PJ, beneficiários, procedimentos e estoque", async () => {
      const horizonte = await prisma.tenant.findFirstOrThrow({ where: { slug: "horizonte" } });
      const [companies, patients, procedures, stock] = await Promise.all([
        prisma.company.count({ where: { tenantId: horizonte.id } }),
        prisma.patient.count({ where: { tenantId: horizonte.id } }),
        prisma.procedure.count({ where: { tenantId: horizonte.id } }),
        prisma.medicalProduct.count({ where: { tenantId: horizonte.id } }),
      ]);
      expect(companies).toBeGreaterThanOrEqual(20);
      expect(patients).toBeGreaterThanOrEqual(30);
      expect(procedures).toBeGreaterThanOrEqual(14);
      expect(stock).toBeGreaterThanOrEqual(3);
    });

    it("operação: agenda, faturas, assinaturas e timeline", async () => {
      const horizonte = await prisma.tenant.findFirstOrThrow({ where: { slug: "horizonte" } });
      const [appointments, invoices, subscriptions, timeline] = await Promise.all([
        prisma.appointment.count({ where: { tenantId: horizonte.id } }),
        prisma.invoice.count({ where: { tenantId: horizonte.id } }),
        prisma.subscription.count({ where: { tenantId: horizonte.id } }),
        prisma.timelineEvent.count({ where: { tenantId: horizonte.id } }),
      ]);
      expect(appointments).toBeGreaterThanOrEqual(20);
      expect(invoices).toBeGreaterThanOrEqual(10);
      expect(subscriptions).toBeGreaterThanOrEqual(3);
      expect(timeline).toBeGreaterThanOrEqual(15);
    });
  });

  describe("Prestador (role PRESTADOR)", () => {
    it("prestador demo com conselho profissional e agenda", async () => {
      const helena = await prisma.user.findUniqueOrThrow({
        where: { email: DEMO_EMAILS.prestador },
        select: {
          role: true,
          councilType: true,
          councilNumber: true,
          tenantId: true,
        },
      });
      expect(helena.role).toBe("PRESTADOR");
      expect(helena.councilType).toBeTruthy();
      expect(helena.councilNumber).toBeTruthy();

      const appointments = await prisma.appointment.count({
        where: { providerId: (await prisma.user.findUniqueOrThrow({ where: { email: DEMO_EMAILS.prestador } })).id },
      });
      expect(appointments).toBeGreaterThanOrEqual(1);
    });

    it("PPU: procedimentos registrados com preço cobrado", async () => {
      const horizonte = await prisma.tenant.findFirstOrThrow({ where: { slug: "horizonte" } });
      const usages = await prisma.procedureUsage.count({
        where: { appointment: { tenantId: horizonte.id } },
      });
      expect(usages).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Empresa PJ (role PJ)", () => {
    it("usuário TechCorp vinculado a empresa ATIVO", async () => {
      const pj = await prisma.user.findUniqueOrThrow({
        where: { email: DEMO_EMAILS.pjTechcorp },
        include: { company: true },
      });
      expect(pj.role).toBe("PJ");
      expect(pj.company?.status).toBe("ATIVO");
      expect(pj.company?.name).toContain("TechCorp");
    });

    it("pipeline CRM com status variados", async () => {
      const horizonte = await prisma.tenant.findFirstOrThrow({ where: { slug: "horizonte" } });
      const statuses = await prisma.company.groupBy({
        by: ["status"],
        where: { tenantId: horizonte.id },
        _count: true,
      });
      const statusSet = new Set(statuses.map((s) => s.status));
      expect(statusSet.has("ATIVO")).toBe(true);
      expect(statusSet.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Beneficiário (role BENEFICIARIO)", () => {
    it("João, Maria e Pedro com portal e fluxos distintos", async () => {
      for (const email of [DEMO_EMAILS.joao, DEMO_EMAILS.maria, DEMO_EMAILS.pedro]) {
        const user = await prisma.user.findUniqueOrThrow({
          where: { email },
          include: { patient: true },
        });
        expect(user.role).toBe("BENEFICIARIO");
        expect(user.patient).toBeTruthy();
      }

      const joaoPending = await prisma.procedureUsage.count({
        where: {
          billed: false,
          appointment: { patient: { cpf: "111.222.333-44" } },
        },
      });
      expect(joaoPending).toBeGreaterThanOrEqual(1);

      const mariaPix = await prisma.payment.count({
        where: {
          status: "PENDING",
          invoice: { patient: { cpf: "555.666.777-88" } },
        },
      });
      expect(mariaPix).toBeGreaterThanOrEqual(1);

      const pedroPaid = await prisma.invoice.count({
        where: { patient: { cpf: "999.000.111-22" }, status: "PAGA" },
      });
      expect(pedroPaid).toBeGreaterThanOrEqual(1);
    });

    it("PEP e Care Chart no João", async () => {
      const joao = await prisma.patient.findFirstOrThrow({
        where: { cpf: "111.222.333-44" },
      });
      const [records, profile] = await Promise.all([
        prisma.medicalRecord.count({ where: { patientId: joao.id } }),
        prisma.patientClinicalProfile.count({ where: { patientId: joao.id } }),
      ]);
      expect(records).toBeGreaterThanOrEqual(2);
      expect(profile).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("Massa demo — cobertura por segmento (multi-nicho)", () => {
  const prisma = getTestPrisma();

  it("8 tenants demo com slugs e nichos esperados", async () => {
    const tenants = await prisma.tenant.findMany({
      where: { slug: { in: [...DEMO_TENANT_SLUGS] } },
      select: { slug: true, niche: true },
    });
    expect(tenants).toHaveLength(DEMO_TENANT_SLUGS.length);
    for (const niche of NICHE_IDS) {
      expect(tenants.some((t) => t.niche === niche)).toBe(true);
    }
  });

  it.each([
    ["petcare", "VET", "operacao@petcare.demo"],
    ["smile", "DENTAL", "operacao@smile.demo"],
    ["lex", "LEGAL", "operacao@lex.demo"],
    ["zen", "SPA", "operacao@zen.demo"],
    ["eduprime", "EDUCATION", "operacao@eduprime.demo"],
  ] as const)("segmento %s (%s) com interno, prestador e massa operacional", async (slug, niche, internoEmail) => {
    const tenant = await prisma.tenant.findFirstOrThrow({ where: { slug } });
    expect(tenant.niche).toBe(niche);

    const [interno, providers, patients, appointments, procedures] = await Promise.all([
      prisma.user.count({ where: { tenantId: tenant.id, role: "INTERNO" } }),
      prisma.user.count({ where: { tenantId: tenant.id, role: "PRESTADOR" } }),
      prisma.patient.count({ where: { tenantId: tenant.id } }),
      prisma.appointment.count({ where: { tenantId: tenant.id } }),
      prisma.procedure.count({ where: { tenantId: tenant.id } }),
    ]);

    expect(interno).toBeGreaterThanOrEqual(1);
    expect(providers).toBeGreaterThanOrEqual(2);
    expect(patients).toBeGreaterThanOrEqual(10);
    expect(appointments).toBeGreaterThanOrEqual(10);
    expect(procedures).toBeGreaterThanOrEqual(10);

    const internoUser = await prisma.user.findUnique({ where: { email: internoEmail } });
    expect(internoUser?.tenantId).toBe(tenant.id);
  });

  it("VET inclui pets, vacinas, estoque e label Banho/Tosa", async () => {
    const petcare = await prisma.tenant.findFirstOrThrow({ where: { slug: "petcare" } });
    const labels = JSON.parse(petcare.labels ?? "{}") as { appointment?: string };
    expect(labels.appointment).toBe("Banho/Tosa");

    const [pets, vaccines, stock, internos] = await Promise.all([
      prisma.pet.count({ where: { tenantId: petcare.id } }),
      prisma.petVaccineRecord.count({ where: { pet: { tenantId: petcare.id } } }),
      prisma.medicalProduct.count({ where: { tenantId: petcare.id } }),
      prisma.user.count({ where: { tenantId: petcare.id, role: "INTERNO" } }),
    ]);
    expect(pets).toBeGreaterThanOrEqual(10);
    expect(vaccines).toBeGreaterThanOrEqual(1);
    expect(stock).toBeGreaterThanOrEqual(3);
    expect(internos).toBeGreaterThanOrEqual(3);
  });

  it.each([
    ["smile", "DENTAL"],
    ["lex", "LEGAL"],
    ["zen", "SPA"],
    ["eduprime", "EDUCATION"],
  ] as const)("segmento %s com massa rica (clínico + estoque + RBAC)", async (slug) => {
    const tenant = await prisma.tenant.findFirstOrThrow({ where: { slug } });
    const [internos, stock, clinical, webhooks, pricing] = await Promise.all([
      prisma.user.count({ where: { tenantId: tenant.id, role: "INTERNO" } }),
      prisma.medicalProduct.count({ where: { tenantId: tenant.id } }),
      prisma.patientClinicalProfile.count({
        where: { patient: { tenantId: tenant.id } },
      }),
      prisma.webhookEndpoint.count({ where: { tenantId: tenant.id } }),
      prisma.pricingRule.count({
        where: { procedure: { tenantId: tenant.id } },
      }),
    ]);
    expect(internos).toBeGreaterThanOrEqual(3);
    expect(stock).toBeGreaterThanOrEqual(2);
    expect(clinical).toBeGreaterThanOrEqual(1);
    expect(webhooks).toBeGreaterThanOrEqual(1);
    expect(pricing).toBeGreaterThanOrEqual(1);
  });
});

describe("Massa demo — features transversais", () => {
  const prisma = getTestPrisma();

  it("webhook B2B e fila de comunicações", async () => {
    const horizonte = await prisma.tenant.findFirstOrThrow({ where: { slug: "horizonte" } });
    const [webhooks, messages] = await Promise.all([
      prisma.webhookEndpoint.count({ where: { tenantId: horizonte.id } }),
      prisma.message.count({ where: { tenantId: horizonte.id } }),
    ]);
    expect(webhooks).toBeGreaterThanOrEqual(1);
    expect(messages).toBeGreaterThanOrEqual(2);
  });

  it("receita: PIX mock e assinaturas recorrentes", async () => {
    const horizonte = await prisma.tenant.findFirstOrThrow({ where: { slug: "horizonte" } });
    const [payments, charges] = await Promise.all([
      prisma.payment.count({ where: { invoice: { tenantId: horizonte.id } } }),
      prisma.subscriptionCharge.count({ where: { subscription: { tenantId: horizonte.id } } }),
    ]);
    expect(payments).toBeGreaterThanOrEqual(3);
    expect(charges).toBeGreaterThanOrEqual(3);
  });
});
