/**
 * Matriz CRUD do sistema — garante Create/Read/Update/Delete (quando existir)
 * nas entidades que ainda não tinham cobertura dedicada em cadastros-crud.
 *
 * Complementa: tests/api/cadastros-crud.test.ts, stock.test.ts, pay-per-use-flow.test.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as petsGet, POST as petsPost } from "@/app/api/interno/pets/route";
import { PATCH as petPatch } from "@/app/api/interno/pets/[id]/route";
import {
  GET as pricingGet,
  POST as pricingPost,
} from "@/app/api/interno/pricing-rules/route";
import {
  PUT as pricingPut,
  DELETE as pricingDelete,
} from "@/app/api/interno/pricing-rules/[id]/route";
import {
  GET as protocolsGet,
  POST as protocolsPost,
} from "@/app/api/interno/protocol-templates/route";
import { PATCH as protocolPatch } from "@/app/api/interno/protocol-templates/[id]/route";
import {
  GET as webhooksGet,
  POST as webhooksPost,
} from "@/app/api/interno/webhooks/route";
import {
  PATCH as webhookPatch,
  DELETE as webhookDelete,
} from "@/app/api/interno/webhooks/[id]/route";
import { GET as deliveriesGet } from "@/app/api/interno/webhooks/deliveries/route";
import {
  GET as messagesGet,
  POST as messagesPost,
} from "@/app/api/interno/messages/route";
import { PATCH as messagePatch } from "@/app/api/interno/messages/[id]/route";
import { GET as clinicMetaGet } from "@/app/api/interno/clinic-finance/meta/route";
import {
  GET as launchesGet,
  POST as launchesPost,
} from "@/app/api/interno/clinic-finance/launches/route";
import {
  GET as expensesGet,
  POST as expensesPost,
} from "@/app/api/interno/clinic-finance/expenses/route";
import { GET as clinicExportGet } from "@/app/api/interno/clinic-finance/export/route";
import {
  GET as brandingGet,
  PUT as brandingPut,
} from "@/app/api/interno/branding/route";
import {
  GET as subscriptionsGet,
  POST as subscriptionsPost,
} from "@/app/api/interno/subscriptions/route";
import { PATCH as subscriptionPatch } from "@/app/api/interno/subscriptions/[id]/route";
import {
  GET as productsGet,
  POST as productsPost,
} from "@/app/api/interno/stock/products/route";
import { PATCH as productPatch } from "@/app/api/interno/stock/products/[id]/route";
import { POST as lotsPost } from "@/app/api/interno/stock/lots/route";
import { PATCH as lotPatch } from "@/app/api/interno/stock/lots/[id]/route";
import { POST as movementsPost } from "@/app/api/interno/stock/movements/route";
import { POST as reverseMovementPost } from "@/app/api/interno/stock/movements/[id]/reverse/route";
import {
  clearSessionMock,
  sessionMockState,
  setSessionForEmail,
} from "../helpers/session-mock";
import { jsonRequest } from "../helpers/request";
import { getTestPrisma } from "../helpers/db";
import { DEMO_EMAILS } from "../helpers/seed-fixtures";

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

const unique = () => Date.now().toString().slice(-8);

describe("API — matriz CRUD do sistema", () => {
  afterEach(() => {
    clearSessionMock();
  });

  describe("Pet (VET / PetCare)", () => {
    beforeEach(async () => {
      await setSessionForEmail("operacao@petcare.demo");
    });

    it("lista, cria e atualiza pet", async () => {
      const prisma = getTestPrisma();
      const tutorUser = await prisma.user.findUniqueOrThrow({
        where: { email: "tutor@petcare.demo" },
        select: { patientId: true },
      });
      expect(tutorUser.patientId).toBeTruthy();

      const listRes = await petsGet(
        new Request("http://localhost/api/interno/pets"),
      );
      expect(listRes.status).toBe(200);
      const listBody = await listRes.json();
      expect(Array.isArray(listBody.pets)).toBe(true);

      const name = `E2E Pet ${unique()}`;
      const createRes = await petsPost(
        jsonRequest("http://localhost/api/interno/pets", {
          method: "POST",
          body: {
            patientId: tutorUser.patientId,
            name,
            species: "CANINO",
            breed: "SRD",
            sex: "M",
            size: "MEDIO",
            weightKg: 12.5,
          },
        }),
      );
      expect(createRes.status).toBe(200);
      const created = await createRes.json();
      const petId = created.pet.id as string;

      const patchRes = await petPatch(
        jsonRequest(`http://localhost/api/interno/pets/${petId}`, {
          method: "PATCH",
          body: { weightKg: 13.2, notes: "atualizado na matriz CRUD" },
        }),
        { params: Promise.resolve({ id: petId }) },
      );
      expect(patchRes.status).toBe(200);
      const patched = await patchRes.json();
      expect(patched.pet.weightKg).toBe(13.2);
    });
  });

  describe("Precificação B2B", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.internoAdmin);
    });

    it("CRUD completo de pricing rule", async () => {
      const prisma = getTestPrisma();
      const interno = await prisma.user.findUniqueOrThrow({
        where: { email: DEMO_EMAILS.internoAdmin },
      });
      const company = await prisma.company.findFirstOrThrow({
        where: { tenantId: interno.tenantId },
      });
      const procedure = await prisma.procedure.findFirstOrThrow({
        where: {
          tenantId: interno.tenantId,
          NOT: { pricingRules: { some: { companyId: company.id } } },
        },
      });
      await prisma.pricingRule.deleteMany({
        where: { companyId: company.id, procedureId: procedure.id },
      });

      const createRes = await pricingPost(
        jsonRequest("http://localhost/api/interno/pricing-rules", {
          method: "POST",
          body: {
            companyId: company.id,
            procedureId: procedure.id,
            multiplier: 0.85,
            description: `Matriz CRUD ${unique()}`,
          },
        }),
      );
      expect(createRes.status).toBe(200);
      const created = await createRes.json();
      const ruleId = created.rule.id as string;

      const listRes = await pricingGet();
      expect(listRes.status).toBe(200);
      const listBody = await listRes.json();
      expect(listBody.rules.some((r: { id: string }) => r.id === ruleId)).toBe(true);

      const putRes = await pricingPut(
        jsonRequest(`http://localhost/api/interno/pricing-rules/${ruleId}`, {
          method: "PUT",
          body: { multiplier: 0.9, description: "atualizado" },
        }),
        { params: Promise.resolve({ id: ruleId }) },
      );
      expect(putRes.status).toBe(200);
      const updated = await putRes.json();
      expect(updated.rule.multiplier).toBe(0.9);

      const delRes = await pricingDelete(
        new Request(`http://localhost/api/interno/pricing-rules/${ruleId}`, {
          method: "DELETE",
        }),
        { params: Promise.resolve({ id: ruleId }) },
      );
      expect(delRes.status).toBe(200);
    });
  });

  describe("Protocolo clínico", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.internoAdmin);
    });

    it("lista, cria e atualiza template", async () => {
      const listRes = await protocolsGet();
      expect(listRes.status).toBe(200);

      const suffix = unique();
      const createRes = await protocolsPost(
        jsonRequest("http://localhost/api/interno/protocol-templates", {
          method: "POST",
          body: {
            name: `Protocolo CRUD ${suffix}`,
            specialty: "Clínica Geral",
            checklist: [
              { id: "c1", label: "Anamnese", required: true },
              { id: "c2", label: "Exame físico", required: true },
            ],
            suggestedReturnDays: 30,
          },
        }),
      );
      expect(createRes.status).toBe(200);
      const created = await createRes.json();
      const id = created.template.id as string;

      const patchRes = await protocolPatch(
        jsonRequest(`http://localhost/api/interno/protocol-templates/${id}`, {
          method: "PATCH",
          body: { suggestedReturnDays: 45, name: `Protocolo CRUD ${suffix} v2` },
        }),
        { params: Promise.resolve({ id }) },
      );
      expect(patchRes.status).toBe(200);
      const patched = await patchRes.json();
      expect(patched.template.suggestedReturnDays).toBe(45);
    });
  });

  describe("Webhook B2B", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.internoAdmin);
    });

    it("CRUD completo + lista entregas", async () => {
      const label = `Hook CRUD ${unique()}`;
      const createRes = await webhooksPost(
        jsonRequest("http://localhost/api/interno/webhooks", {
          method: "POST",
          body: {
            label,
            url: "https://example.com/hooks/bibi-crud",
            events: ["INVOICE_ISSUED", "PATIENT_CREATED"],
          },
        }),
      );
      expect(createRes.status).toBe(200);
      const created = await createRes.json();
      const id = created.webhook.id as string;

      const listRes = await webhooksGet();
      expect(listRes.status).toBe(200);
      const listBody = await listRes.json();
      expect(listBody.webhooks.some((w: { id: string }) => w.id === id)).toBe(true);

      const patchRes = await webhookPatch(
        jsonRequest(`http://localhost/api/interno/webhooks/${id}`, {
          method: "PATCH",
          body: { active: false },
        }),
        { params: Promise.resolve({ id }) },
      );
      expect(patchRes.status).toBe(200);
      const patched = await patchRes.json();
      expect(patched.active).toBe(false);

      const deliveriesRes = await deliveriesGet();
      expect(deliveriesRes.status).toBe(200);

      const delRes = await webhookDelete(
        new Request(`http://localhost/api/interno/webhooks/${id}`, {
          method: "DELETE",
        }),
        { params: Promise.resolve({ id }) },
      );
      expect(delRes.status).toBe(200);
    });
  });

  describe("Mensagem / campanha", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.internoAdmin);
    });

    it("enfileira, lista e cancela mensagem", async () => {
      const prisma = getTestPrisma();
      const joao = await prisma.user.findUniqueOrThrow({
        where: { email: DEMO_EMAILS.joao },
        select: { patientId: true },
      });
      expect(joao.patientId).toBeTruthy();

      const createRes = await messagesPost(
        jsonRequest("http://localhost/api/interno/messages", {
          method: "POST",
          body: {
            patientId: joao.patientId,
            channel: "EMAIL",
            template: "GENERIC",
            subject: `CRUD ${unique()}`,
            body: "Mensagem de teste da matriz CRUD",
          },
        }),
      );
      expect(createRes.status).toBe(200);
      const created = await createRes.json();
      // Route devolve { message } (mapMessage)
      const id = (created.message?.id ?? created.id) as string;
      expect(id).toBeTruthy();

      const listRes = await messagesGet();
      expect(listRes.status).toBe(200);
      const listBody = await listRes.json();
      expect(listBody.messages.some((m: { id: string }) => m.id === id)).toBe(true);

      const cancelRes = await messagePatch(
        jsonRequest(`http://localhost/api/interno/messages/${id}`, {
          method: "PATCH",
          body: { action: "cancel" },
        }),
        { params: Promise.resolve({ id }) },
      );
      expect(cancelRes.status).toBe(200);
      const cancelled = await cancelRes.json();
      expect(cancelled.message.status).toBe("CANCELADA");
    });
  });

  describe("Gestão clínica CEDIG", () => {
    beforeEach(async () => {
      await setSessionForEmail("operacao@cedig.demo");
    });

    it("meta, lançamento, despesa e export", async () => {
      const metaRes = await clinicMetaGet();
      expect(metaRes.status).toBe(200);
      const meta = await metaRes.json();
      expect(Array.isArray(meta.providers)).toBe(true);
      expect(Array.isArray(meta.procedures)).toBe(true);
      expect(meta.providers.length).toBeGreaterThan(0);
      expect(meta.procedures.length).toBeGreaterThan(0);

      const providerId = meta.providers[0].id as string;
      const procedureId = meta.procedures[0].id as string;
      const now = new Date();

      const launchRes = await launchesPost(
        jsonRequest("http://localhost/api/interno/clinic-finance/launches", {
          method: "POST",
          body: {
            performedAt: now.toISOString(),
            patientName: `Paciente CRUD ${unique()}`,
            providerId,
            procedureId,
            paymentMethod: "PIX",
            priceTable: "PARTICULAR",
            amountReceived: 750,
            biopsies: 0,
            polypectomies: 0,
            mucosectomies: 0,
            clips: 0,
            syncOperations: true,
          },
        }),
      );
      expect(launchRes.status).toBe(201);
      const launchBody = await launchRes.json();
      expect(launchBody.launch?.id || launchBody.id).toBeTruthy();

      const listLaunches = await launchesGet(
        new Request(
          `http://localhost/api/interno/clinic-finance/launches?year=${now.getFullYear()}&month=${now.getMonth() + 1}`,
        ),
      );
      expect(listLaunches.status).toBe(200);

      const expenseRes = await expensesPost(
        jsonRequest("http://localhost/api/interno/clinic-finance/expenses", {
          method: "POST",
          body: {
            category: "INSUMOS",
            description: `Despesa CRUD ${unique()}`,
            amount: 120.5,
            expenseDate: now.toISOString().slice(0, 10),
          },
        }),
      );
      expect(expenseRes.status).toBe(201);

      const listExpenses = await expensesGet(
        new Request(
          `http://localhost/api/interno/clinic-finance/expenses?year=${now.getFullYear()}&month=${now.getMonth() + 1}`,
        ),
      );
      expect(listExpenses.status).toBe(200);

      const exportCsv = await clinicExportGet(
        new Request(
          `http://localhost/api/interno/clinic-finance/export?year=${now.getFullYear()}&month=${now.getMonth() + 1}&format=csv`,
        ),
      );
      expect(exportCsv.status, await exportCsv.clone().text()).toBe(200);
      expect((await exportCsv.text()).length).toBeGreaterThan(10);

      // XLSX — título contém "/" (mês/ano); sanitize no tabular export
      const exportXlsx = await clinicExportGet(
        new Request(
          `http://localhost/api/interno/clinic-finance/export?year=${now.getFullYear()}&month=${now.getMonth() + 1}&format=xlsx`,
        ),
      );
      expect(exportXlsx.status, await exportXlsx.clone().text()).toBe(200);
      const buf = Buffer.from(await exportXlsx.arrayBuffer());
      expect(buf.byteLength).toBeGreaterThan(100);
    });
  });

  describe("Branding white label", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.internoAdmin);
    });

    it("GET e PUT identidade visual", async () => {
      const getRes = await brandingGet();
      expect(getRes.status).toBe(200);
      const current = await getRes.json();
      expect(current.branding?.displayName).toBeTruthy();

      const putRes = await brandingPut(
        jsonRequest("http://localhost/api/interno/branding", {
          method: "PUT",
          body: {
            displayName: current.branding.displayName,
            tagline: current.branding.tagline ?? "Matriz CRUD",
            primaryColor: current.branding.primaryColor || "#0f766e",
            accentColor: current.branding.accentColor || "#14b8a6",
            heroFrom: current.branding.heroFrom || "#0f766e",
            heroTo: current.branding.heroTo || "#134e4a",
            platformLabel: current.branding.platformLabel || "ServiceOS",
            colorScheme: current.branding.colorScheme || "teal",
          },
        }),
      );
      expect(putRes.status).toBe(200);
    });
  });

  describe("Assinatura recorrente", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.internoAdmin);
    });

    it("cria, lista e atualiza assinatura", async () => {
      const prisma = getTestPrisma();
      const pedro = await prisma.user.findUniqueOrThrow({
        where: { email: DEMO_EMAILS.pedro },
        select: { patientId: true },
      });
      expect(pedro.patientId).toBeTruthy();

      const createRes = await subscriptionsPost(
        jsonRequest("http://localhost/api/interno/subscriptions", {
          method: "POST",
          body: {
            patientId: pedro.patientId,
            billingCycle: "MENSAL",
            startDate: new Date().toISOString().slice(0, 10),
            amount: 199.9,
            description: `Assinatura CRUD ${unique()}`,
            status: "ATIVA",
          },
        }),
      );
      expect(createRes.status).toBe(200);
      const created = await createRes.json();
      const id = created.subscription.id as string;

      const listRes = await subscriptionsGet();
      expect(listRes.status).toBe(200);
      const listBody = await listRes.json();
      expect(listBody.subscriptions.some((s: { id: string }) => s.id === id)).toBe(true);

      const patchRes = await subscriptionPatch(
        jsonRequest(`http://localhost/api/interno/subscriptions/${id}`, {
          method: "PATCH",
          body: { amount: 249.9, description: "valor ajustado" },
        }),
        { params: Promise.resolve({ id }) },
      );
      expect(patchRes.status).toBe(200);
    });
  });

  describe("Estoque — update e reversão", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.internoAdmin);
    });

    it("PATCH produto, PATCH lote e reverse de movimentação", async () => {
      const suffix = unique();
      const createProduct = await productsPost(
        jsonRequest("http://localhost/api/interno/stock/products", {
          method: "POST",
          body: {
            sku: `CRUD-${suffix}`,
            name: `Produto CRUD ${suffix}`,
            category: "INSUMO",
            minStock: 2,
          },
        }),
      );
      expect(createProduct.status, await createProduct.clone().text()).toBe(200);
      const productBody = await createProduct.json();
      const productId = productBody.product.id as string;

      const patchProduct = await productPatch(
        jsonRequest(`http://localhost/api/interno/stock/products/${productId}`, {
          method: "PATCH",
          body: { minStock: 5, name: `Produto CRUD ${suffix} edit` },
        }),
        { params: Promise.resolve({ id: productId }) },
      );
      expect(patchProduct.status).toBe(200);

      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      const lotRes = await lotsPost(
        jsonRequest("http://localhost/api/interno/stock/lots", {
          method: "POST",
          body: {
            productId,
            lotNumber: `L-${suffix}`,
            quantity: 10,
            expiryDate: expiry.toISOString(),
            unitCost: 1.5,
          },
        }),
      );
      expect(lotRes.status, await lotRes.clone().text()).toBe(200);
      // receiveStockEntry devolve { ok: true } — resolve o lote pelo número
      const prisma = getTestPrisma();
      const lot = await prisma.stockLot.findFirstOrThrow({
        where: { productId, lotNumber: `L-${suffix}` },
      });
      const lotId = lot.id;

      const patchLot = await lotPatch(
        jsonRequest(`http://localhost/api/interno/stock/lots/${lotId}`, {
          method: "PATCH",
          body: { status: "QUARENTENA" },
        }),
        { params: Promise.resolve({ id: lotId }) },
      );
      expect(patchLot.status, await patchLot.clone().text()).toBe(200);

      // Reabre lote para permitir SAIDA (reverse só compensa outbound com lote)
      await lotPatch(
        jsonRequest(`http://localhost/api/interno/stock/lots/${lotId}`, {
          method: "PATCH",
          body: { status: "DISPONIVEL" },
        }),
        { params: Promise.resolve({ id: lotId }) },
      );

      const movRes = await movementsPost(
        jsonRequest("http://localhost/api/interno/stock/movements", {
          method: "POST",
          body: {
            productId,
            type: "SAIDA",
            quantity: 1,
            reason: "matriz CRUD",
          },
        }),
      );
      expect(movRes.status, await movRes.clone().text()).toBe(200);

      const lastExit = await prisma.stockMovement.findFirstOrThrow({
        where: { productId, type: "SAIDA" },
        orderBy: { createdAt: "desc" },
      });

      const reverseRes = await reverseMovementPost(
        jsonRequest(`http://localhost/api/interno/stock/movements/${lastExit.id}/reverse`, {
          method: "POST",
          body: { reason: "teste reverse matriz CRUD" },
        }),
        { params: Promise.resolve({ id: lastExit.id }) },
      );
      expect(reverseRes.status, await reverseRes.clone().text()).toBe(200);

      const listProducts = await productsGet();
      expect(listProducts.status).toBe(200);
    });
  });
});
