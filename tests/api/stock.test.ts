import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as productsGet, POST as productsPost } from "@/app/api/interno/stock/products/route";
import { POST as lotsPost } from "@/app/api/interno/stock/lots/route";
import { POST as movementsPost } from "@/app/api/interno/stock/movements/route";
import { GET as alertsGet } from "@/app/api/interno/stock/alerts/route";
import { POST as kitPost } from "@/app/api/interno/stock/procedure-kits/[procedureId]/route";
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

describe("Estoque médico — APIs", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("GET /api/interno/stock/products retorna catálogo do seed", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const res = await productsGet();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.products.length).toBeGreaterThanOrEqual(6);
    expect(data.overview.productCount).toBeGreaterThanOrEqual(6);
    expect(data.overview.inventoryValue).toBeGreaterThan(0);
  });

  it("POST entrada de lote incrementa saldo", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const listRes = await productsGet();
    const listData = await listRes.json();
    const product = listData.products.find((p: { sku: string }) => p.sku === "MAT-GAZE");
    expect(product).toBeTruthy();

    const beforeQty = product.totalStock;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2);

    const res = await lotsPost(
      jsonRequest("http://localhost/api/interno/stock/lots", {
        method: "POST",
        body: {
          productId: product.id,
          lotNumber: "TEST-GAZE-001",
          expiryDate: expiry.toISOString(),
          quantity: 10,
          unitCost: 0.3,
        },
      }),
    );
    expect(res.status).toBe(200);

    const afterRes = await productsGet();
    const afterData = await afterRes.json();
    const updated = afterData.products.find((p: { id: string }) => p.id === product.id);
    expect(updated.totalStock).toBe(beforeQty + 10);
  });

  it("POST movimentação SAIDA respeita saldo disponível", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const listRes = await productsGet();
    const listData = await listRes.json();
    const product = listData.products.find((p: { sku: string }) => p.sku === "MAT-AGU25");
    expect(product).toBeTruthy();

    const okRes = await movementsPost(
      jsonRequest("http://localhost/api/interno/stock/movements", {
        method: "POST",
        body: { productId: product.id, type: "SAIDA", quantity: 1, reason: "Teste unitário" },
      }),
    );
    expect(okRes.status).toBe(200);

    const failRes = await movementsPost(
      jsonRequest("http://localhost/api/interno/stock/movements", {
        method: "POST",
        body: { productId: product.id, type: "SAIDA", quantity: 99999 },
      }),
    );
    expect(failRes.status).toBe(400);
    const failData = await failRes.json();
    expect(failData.error).toMatch(/insuficiente/i);
  });

  it("GET /api/interno/stock/alerts inclui alertas de validade", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const res = await alertsGet();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.alerts)).toBe(true);
    expect(data.alerts.some((a: { kind: string }) => a.kind === "EXPIRING" || a.kind === "EXPIRED")).toBe(
      true,
    );
  });

  it("kit de procedimento baixa estoque ao registrar Pay Per Use", async () => {
    const prisma = getTestPrisma();
    const provider = await prisma.user.findUniqueOrThrow({
      where: { email: "dra.helena@bibi.health" },
    });
    const procedure = await prisma.procedure.findFirst({ where: { code: "CON-CLM" } });
    const patient = await prisma.patient.findFirst({ where: { cpf: "111.222.333-44" } });
    expect(procedure && patient).toBeTruthy();

    const luva = await prisma.medicalProduct.findFirst({
      where: { sku: "MAT-LUVA-M" },
    });
    expect(luva).toBeTruthy();

    const lotsBefore = await prisma.stockLot.aggregate({
      where: { productId: luva!.id, status: "DISPONIVEL" },
      _sum: { quantity: true },
    });
    const stockBefore = lotsBefore._sum.quantity ?? 0;

    const slot = new Date();
    slot.setDate(slot.getDate() + 200);
    slot.setHours(10 + Math.floor(Math.random() * 8), 15, 0, 0);

    await setSessionForEmail("recepcao@bibi.health");
    const { POST: createAppointmentPost } = await import("@/app/api/interno/appointments/route");
    const apptRes = await createAppointmentPost(
      jsonRequest("http://localhost/api/interno/appointments", {
        method: "POST",
        body: {
          patientId: patient!.id,
          providerId: provider.id,
          scheduledAt: slot.toISOString(),
          reason: "Teste estoque kit",
          status: "CONFIRMADO",
        },
      }),
    );
    expect(apptRes.status, await apptRes.clone().text()).toBe(200);
    const apptBody = await apptRes.json();
    const appointmentId = apptBody.appointment.id as string;

    await setSessionForEmail("dra.helena@bibi.health");
    const procRes = await registerProcedurePost(
      jsonRequest(
        `http://localhost/api/prestador/appointments/${appointmentId}/procedures`,
        { method: "POST", body: { procedureId: procedure!.id } },
      ),
      { params: Promise.resolve({ id: appointmentId }) },
    );
    expect(procRes.status).toBe(200);
    const procBody = await procRes.json();
    expect(procBody.stockConsumed?.length).toBeGreaterThan(0);

    const lotsAfter = await prisma.stockLot.aggregate({
      where: { productId: luva!.id, status: "DISPONIVEL" },
      _sum: { quantity: true },
    });
    const stockAfter = lotsAfter._sum.quantity ?? 0;
    expect(stockAfter).toBeLessThan(stockBefore);
  });

  it("RBAC — FATURAMENTO não acessa estoque", async () => {
    await setSessionForEmail("financeiro@bibi.health");
    const res = await productsGet();
    expect(res.status).toBe(403);
  });

  it("cadastra produto novo via API", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const sku = `TEST-PROD-${Date.now()}`;
    const res = await productsPost(
      jsonRequest("http://localhost/api/interno/stock/products", {
        method: "POST",
        body: {
          sku,
          name: "Produto teste automatizado",
          category: "INSUMO",
          minStock: 5,
        },
      }),
    );
    expect(res.status, await res.clone().text()).toBe(200);
    const data = await res.json();
    expect(data.product.sku).toBe(sku);
  });

  it("vincula item ao kit de procedimento", async () => {
    const prisma = getTestPrisma();
    const procedure = await prisma.procedure.findFirst({ where: { code: "CON-PSI" } });
    const product = await prisma.medicalProduct.findFirst({ where: { sku: "MAT-SORO500" } });
    expect(procedure && product).toBeTruthy();

    await setSessionForEmail("recepcao@bibi.health");
    const res = await kitPost(
      jsonRequest(`http://localhost/api/interno/stock/procedure-kits/${procedure!.id}`, {
        method: "POST",
        body: { productId: product!.id, quantity: 0.5 },
      }),
      { params: Promise.resolve({ procedureId: procedure!.id }) },
    );
    expect(res.status).toBe(200);
  });
});
