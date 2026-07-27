import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as productsGet, POST as productsPost } from "@/app/api/interno/stock/products/route";
import { PATCH as productPatch } from "@/app/api/interno/stock/products/[id]/route";
import { POST as lotsPost } from "@/app/api/interno/stock/lots/route";
import { PATCH as lotPatch } from "@/app/api/interno/stock/lots/[id]/route";
import { GET as movementsGet, POST as movementsPost } from "@/app/api/interno/stock/movements/route";
import { POST as reverseMovementPost } from "@/app/api/interno/stock/movements/[id]/reverse/route";
import { GET as alertsGet } from "@/app/api/interno/stock/alerts/route";
import { GET as kitGet, POST as kitPost } from "@/app/api/interno/stock/procedure-kits/[procedureId]/route";
import { POST as registerProcedurePost } from "@/app/api/prestador/appointments/[id]/procedures/route";
import {
  GET as materialsGet,
  POST as materialsPost,
} from "@/app/api/prestador/appointments/[id]/materials/route";
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

async function createUniqueAppointment(reason: string) {
  const prisma = getTestPrisma();
  const provider = await prisma.user.findUniqueOrThrow({
    where: { email: "dra.helena@bibi.health" },
  });
  const patient = await prisma.patient.findFirst({ where: { cpf: "529.982.247-25" } });
  expect(patient).toBeTruthy();

  await setSessionForEmail("recepcao@bibi.health");
  const { POST: createAppointmentPost } = await import("@/app/api/interno/appointments/route");

  // Evita colisão de slot com seed/operacional e entre testes paralelos do arquivo.
  for (let attempt = 0; attempt < 8; attempt++) {
    const slot = new Date();
    const dayOffset = 260 + attempt * 3 + (Date.now() % 17);
    const minuteSlot = (Date.now() + attempt * 13) % 48;
    slot.setDate(slot.getDate() + dayOffset);
    slot.setHours(6 + Math.floor(minuteSlot / 4), (minuteSlot % 4) * 15, attempt % 60, 0);

    const apptRes = await createAppointmentPost(
      jsonRequest("http://localhost/api/interno/appointments", {
        method: "POST",
        body: {
          patientId: patient!.id,
          providerId: provider.id,
          scheduledAt: slot.toISOString(),
          reason,
          status: "CONFIRMADO",
        },
      }),
    );
    if (apptRes.status === 200) {
      const apptBody = await apptRes.json();
      return apptBody.appointment.id as string;
    }
    const text = await apptRes.text();
    if (!/conflito|ocupado|indispon/i.test(text) && apptRes.status !== 400) {
      expect.fail(`Falha ao criar agendamento (${apptRes.status}): ${text}`);
    }
  }

  expect.fail("Não foi possível alocar slot único para o teste de estoque");
}

describe("Estoque clínico — catálogo, lotes, movimentos e alertas", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("GET /api/interno/stock/products retorna catálogo do seed com overview financeiro", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const res = await productsGet();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.products.length).toBeGreaterThanOrEqual(6);
    expect(data.overview.productCount).toBeGreaterThanOrEqual(6);
    expect(data.overview.inventoryValue).toBeGreaterThan(0);
  });

  it("POST entrada de lote incrementa saldo e aparece em movimentos", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const listRes = await productsGet();
    const listData = await listRes.json();
    const product = listData.products.find((p: { sku: string }) => p.sku === "MAT-GAZE");
    expect(product).toBeTruthy();

    const beforeQty = product.totalStock;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2);
    const lotNumber = `GAZE-${Date.now().toString(36).toUpperCase()}`;

    const res = await lotsPost(
      jsonRequest("http://localhost/api/interno/stock/lots", {
        method: "POST",
        body: {
          productId: product.id,
          lotNumber,
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

    const movRes = await movementsGet(
      new Request("http://localhost/api/interno/stock/movements?limit=20"),
    );
    expect(movRes.status).toBe(200);
    const movData = await movRes.json();
    expect(
      movData.movements.some(
        (m: { productSku: string; lotNumber: string | null; type: string }) =>
          m.productSku === "MAT-GAZE" && m.lotNumber === lotNumber && m.type === "ENTRADA",
      ),
    ).toBe(true);
  });

  it("POST movimentação SAIDA respeita saldo disponível e rejeita overdraw", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const listRes = await productsGet();
    const listData = await listRes.json();
    const product = listData.products.find((p: { sku: string }) => p.sku === "MAT-AGU25");
    expect(product).toBeTruthy();

    const okRes = await movementsPost(
      jsonRequest("http://localhost/api/interno/stock/movements", {
        method: "POST",
        body: {
          productId: product.id,
          type: "SAIDA",
          quantity: 1,
          reason: "Consumo em sala de procedimento",
        },
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

  it("GET /api/interno/stock/alerts inclui alertas de validade do seed operacional", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const res = await alertsGet();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.alerts)).toBe(true);
    expect(data.alerts.some((a: { kind: string }) => a.kind === "EXPIRING" || a.kind === "EXPIRED")).toBe(
      true,
    );
  });

  it("PATCH produto atualiza mínimo e nome sem alterar SKU", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const sku = `MAT-ALG-${Date.now().toString(36).toUpperCase()}`;
    const createRes = await productsPost(
      jsonRequest("http://localhost/api/interno/stock/products", {
        method: "POST",
        body: {
          sku,
          name: "Algodão hidrófilo 500g",
          category: "INSUMO",
          minStock: 5,
        },
      }),
    );
    expect(createRes.status, await createRes.clone().text()).toBe(200);
    const created = await createRes.json();

    const patchRes = await productPatch(
      jsonRequest(`http://localhost/api/interno/stock/products/${created.product.id}`, {
        method: "PATCH",
        body: { name: "Algodão hidrófilo 500g — reforço", minStock: 12, active: true },
      }),
      { params: Promise.resolve({ id: created.product.id }) },
    );
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();
    expect(patched.product.sku).toBe(sku);
    expect(patched.product.minStock).toBe(12);
    expect(patched.product.name).toContain("reforço");
  });

  it("lote em QUARENTENA não entra no saldo disponível para SAIDA FIFO", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const prisma = getTestPrisma();
    const sku = `MAT-SER-${Date.now().toString(36).toUpperCase()}`;
    const createRes = await productsPost(
      jsonRequest("http://localhost/api/interno/stock/products", {
        method: "POST",
        body: { sku, name: "Seringa 5ml descartável", category: "MATERIAL", minStock: 1 },
      }),
    );
    const created = await createRes.json();
    const productId = created.product.id as string;

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    const lotNumber = `L-${Date.now().toString(36).toUpperCase()}`;
    const lotRes = await lotsPost(
      jsonRequest("http://localhost/api/interno/stock/lots", {
        method: "POST",
        body: {
          productId,
          lotNumber,
          quantity: 4,
          expiryDate: expiry.toISOString(),
          unitCost: 0.8,
        },
      }),
    );
    expect(lotRes.status).toBe(200);

    const lot = await prisma.stockLot.findFirstOrThrow({ where: { productId, lotNumber } });
    const quarantine = await lotPatch(
      jsonRequest(`http://localhost/api/interno/stock/lots/${lot.id}`, {
        method: "PATCH",
        body: { status: "QUARENTENA" },
      }),
      { params: Promise.resolve({ id: lot.id }) },
    );
    expect(quarantine.status).toBe(200);

    const failRes = await movementsPost(
      jsonRequest("http://localhost/api/interno/stock/movements", {
        method: "POST",
        body: { productId, type: "SAIDA", quantity: 1, reason: "Tentativa com lote em quarentena" },
      }),
    );
    expect(failRes.status).toBe(400);
    const failData = await failRes.json();
    expect(failData.error).toMatch(/insuficiente/i);
  });

  it("reversão de SAIDA devolve saldo; reversão de ENTRADA reduz saldo do lote", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const prisma = getTestPrisma();
    const sku = `MAT-REV-${Date.now().toString(36).toUpperCase()}`;
    const createRes = await productsPost(
      jsonRequest("http://localhost/api/interno/stock/products", {
        method: "POST",
        body: { sku, name: "Luva cirúrgica estéril 7.5", category: "MATERIAL", minStock: 2 },
      }),
    );
    const productId = (await createRes.json()).product.id as string;

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    const lotNumber = `REV-${Date.now().toString(36).toUpperCase()}`;
    await lotsPost(
      jsonRequest("http://localhost/api/interno/stock/lots", {
        method: "POST",
        body: {
          productId,
          lotNumber,
          quantity: 20,
          expiryDate: expiry.toISOString(),
          unitCost: 2.5,
        },
      }),
    );

    const entrada = await prisma.stockMovement.findFirstOrThrow({
      where: { productId, type: "ENTRADA" },
      orderBy: { createdAt: "desc" },
    });

    await movementsPost(
      jsonRequest("http://localhost/api/interno/stock/movements", {
        method: "POST",
        body: { productId, type: "SAIDA", quantity: 3, reason: "Consumo em curativo" },
      }),
    );
    const saida = await prisma.stockMovement.findFirstOrThrow({
      where: { productId, type: "SAIDA" },
      orderBy: { createdAt: "desc" },
    });

    const reverseSaida = await reverseMovementPost(
      jsonRequest(`http://localhost/api/interno/stock/movements/${saida.id}/reverse`, {
        method: "POST",
        body: { reason: "Estorno de saída indevida" },
      }),
      { params: Promise.resolve({ id: saida.id }) },
    );
    expect(reverseSaida.status, await reverseSaida.clone().text()).toBe(200);

    const lotAfterSaidaReverse = await prisma.stockLot.findFirstOrThrow({
      where: { productId, lotNumber },
    });
    expect(lotAfterSaidaReverse.quantity).toBe(20);

    const reverseEntrada = await reverseMovementPost(
      jsonRequest(`http://localhost/api/interno/stock/movements/${entrada.id}/reverse`, {
        method: "POST",
        body: { reason: "Estorno de entrada duplicada" },
      }),
      { params: Promise.resolve({ id: entrada.id }) },
    );
    expect(reverseEntrada.status, await reverseEntrada.clone().text()).toBe(200);

    const lotAfterEntradaReverse = await prisma.stockLot.findFirstOrThrow({
      where: { productId, lotNumber },
    });
    expect(lotAfterEntradaReverse.quantity).toBe(0);
  });

  it("reversão de DISPENSACAO restaura saldo do lote consumido no atendimento", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const prisma = getTestPrisma();
    const product = await prisma.medicalProduct.findFirstOrThrow({ where: { sku: "MAT-SORO500" } });
    const lotBefore = await prisma.stockLot.aggregate({
      where: { productId: product.id, status: "DISPONIVEL" },
      _sum: { quantity: true },
    });
    const stockBefore = lotBefore._sum.quantity ?? 0;

    const appointmentId = await createUniqueAppointment("Avaliação clínica com soro");
    await setSessionForEmail("dra.helena@bibi.health");
    const dispense = await materialsPost(
      jsonRequest(`http://localhost/api/prestador/appointments/${appointmentId}/materials`, {
        method: "POST",
        body: { productId: product.id, quantity: 1 },
      }),
      { params: Promise.resolve({ id: appointmentId }) },
    );
    expect(dispense.status, await dispense.clone().text()).toBe(200);

    const movement = await prisma.stockMovement.findFirstOrThrow({
      where: { appointmentId, productId: product.id, type: "DISPENSACAO" },
      orderBy: { createdAt: "desc" },
    });

    await setSessionForEmail("recepcao@bibi.health");
    const reverseRes = await reverseMovementPost(
      jsonRequest(`http://localhost/api/interno/stock/movements/${movement.id}/reverse`, {
        method: "POST",
        body: { reason: "Dispensação lançada no paciente errado" },
      }),
      { params: Promise.resolve({ id: movement.id }) },
    );
    expect(reverseRes.status, await reverseRes.clone().text()).toBe(200);

    const lotAfter = await prisma.stockLot.aggregate({
      where: { productId: product.id, status: "DISPONIVEL" },
      _sum: { quantity: true },
    });
    expect(lotAfter._sum.quantity ?? 0).toBe(stockBefore);
  });

  it("RBAC — FATURAMENTO não acessa estoque", async () => {
    await setSessionForEmail("financeiro@bibi.health");
    const res = await productsGet();
    expect(res.status).toBe(403);
  });

  it("cadastra produto novo via API com categoria e unidade válidas", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const sku = `MAT-COMP-${Date.now().toString(36).toUpperCase()}`;
    const res = await productsPost(
      jsonRequest("http://localhost/api/interno/stock/products", {
        method: "POST",
        body: {
          sku,
          name: "Compressa estéril 10x10",
          category: "INSUMO",
          minStock: 5,
        },
      }),
    );
    expect(res.status, await res.clone().text()).toBe(200);
    const data = await res.json();
    expect(data.product.sku).toBe(sku);
  });

  it("aceita categoria SERVICO e unidade SC do catálogo multi-nicho", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const sku = `ENG-CIM-${Date.now().toString(36).toUpperCase()}`;
    const res = await productsPost(
      jsonRequest("http://localhost/api/interno/stock/products", {
        method: "POST",
        body: {
          sku,
          name: "Cimento CP-II 50kg",
          category: "SERVICO",
          unit: "SC",
          minStock: 8,
        },
      }),
    );
    expect(res.status, await res.clone().text()).toBe(200);
    const data = await res.json();
    expect(data.product.sku).toBe(sku);
    expect(data.product.category).toBe("SERVICO");
    expect(data.product.unit).toBe("SC");
  });

  it("produto requiresLot=false aceita entrada sem nº/validade e permite SAIDA/FIFO", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const prisma = getTestPrisma();
    const sku = `SRV-CRED-${Date.now().toString(36).toUpperCase()}`;
    const createRes = await productsPost(
      jsonRequest("http://localhost/api/interno/stock/products", {
        method: "POST",
        body: {
          sku,
          name: "Crédito de digitalização processual",
          category: "SERVICO",
          unit: "UN",
          minStock: 5,
          requiresLot: false,
        },
      }),
    );
    expect(createRes.status, await createRes.clone().text()).toBe(200);
    const productId = (await createRes.json()).product.id as string;

    const entryRes = await lotsPost(
      jsonRequest("http://localhost/api/interno/stock/lots", {
        method: "POST",
        body: { productId, quantity: 12, unitCost: 1.1 },
      }),
    );
    expect(entryRes.status, await entryRes.clone().text()).toBe(200);

    const synthetic = await prisma.stockLot.findFirstOrThrow({
      where: { productId, lotNumber: "SEM-LOTE" },
    });
    expect(synthetic.quantity).toBe(12);

    const saidaRes = await movementsPost(
      jsonRequest("http://localhost/api/interno/stock/movements", {
        method: "POST",
        body: {
          productId,
          type: "SAIDA",
          quantity: 3,
          reason: "Consumo de crédito em protocolo",
        },
      }),
    );
    expect(saidaRes.status, await saidaRes.clone().text()).toBe(200);

    const after = await prisma.stockLot.findFirstOrThrow({
      where: { id: synthetic.id },
    });
    expect(after.quantity).toBe(9);

    const listRes = await productsGet();
    const listed = (await listRes.json()).products.find(
      (p: { id: string }) => p.id === productId,
    );
    expect(listed.requiresLot).toBe(false);
    expect(listed.totalStock).toBe(9);
  });

  it("produto com requiresLot=true rejeita entrada sem lote/validade", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const listRes = await productsGet();
    const product = (await listRes.json()).products.find(
      (p: { sku: string; requiresLot: boolean }) => p.sku === "MAT-GAZE" && p.requiresLot,
    );
    expect(product).toBeTruthy();

    const failRes = await lotsPost(
      jsonRequest("http://localhost/api/interno/stock/lots", {
        method: "POST",
        body: { productId: product.id, quantity: 2 },
      }),
    );
    expect(failRes.status).toBe(400);
    const body = await failRes.json();
    expect(body.error).toMatch(/lote|validade/i);
  });

  it("rejeita categoria inválida no cadastro de produto", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const res = await productsPost(
      jsonRequest("http://localhost/api/interno/stock/products", {
        method: "POST",
        body: {
          sku: `INV-${Date.now().toString(36).toUpperCase()}`,
          name: "Item inválido",
          category: "FOO_BAR",
        },
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/categoria/i);
  });
});

describe("Estoque clínico — kits Pay Per Use e dispensação no atendimento", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("kit de procedimento baixa estoque ao registrar Pay Per Use", async () => {
    const prisma = getTestPrisma();
    const procedure = await prisma.procedure.findFirst({ where: { code: "CON-CLM" } });
    const luva = await prisma.medicalProduct.findFirst({ where: { sku: "MAT-LUVA-M" } });
    expect(procedure && luva).toBeTruthy();

    const lotsBefore = await prisma.stockLot.aggregate({
      where: { productId: luva!.id, status: "DISPONIVEL" },
      _sum: { quantity: true },
    });
    const stockBefore = lotsBefore._sum.quantity ?? 0;

    const appointmentId = await createUniqueAppointment("Consulta clínica com kit de materiais");

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

  it("vincula item ao kit de procedimento e lista via GET", async () => {
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

    const listRes = await kitGet(
      new Request(`http://localhost/api/interno/stock/procedure-kits/${procedure!.id}`),
      { params: Promise.resolve({ procedureId: procedure!.id }) },
    );
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(
      listData.items.some((item: { productSku: string; quantity: number }) =>
        item.productSku === "MAT-SORO500" && item.quantity === 0.5,
      ),
    ).toBe(true);
  });

  it("dispensação manual no atendimento reduz estoque e aparece no histórico", async () => {
    const prisma = getTestPrisma();
    const product = await prisma.medicalProduct.findFirstOrThrow({ where: { sku: "MAT-GAZE" } });
    const before = await prisma.stockLot.aggregate({
      where: { productId: product.id, status: "DISPONIVEL" },
      _sum: { quantity: true },
    });

    const appointmentId = await createUniqueAppointment("Curativo ambulatorial");
    await setSessionForEmail("dra.helena@bibi.health");

    const listRes = await materialsGet(
      new Request(`http://localhost/api/prestador/appointments/${appointmentId}/materials`),
      { params: Promise.resolve({ id: appointmentId }) },
    );
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.products.some((p: { sku: string }) => p.sku === "MAT-GAZE")).toBe(true);

    const dispense = await materialsPost(
      jsonRequest(`http://localhost/api/prestador/appointments/${appointmentId}/materials`, {
        method: "POST",
        body: { productId: product.id, quantity: 2 },
      }),
      { params: Promise.resolve({ id: appointmentId }) },
    );
    expect(dispense.status, await dispense.clone().text()).toBe(200);

    const afterList = await materialsGet(
      new Request(`http://localhost/api/prestador/appointments/${appointmentId}/materials`),
      { params: Promise.resolve({ id: appointmentId }) },
    );
    const afterData = await afterList.json();
    expect(afterData.dispensations.length).toBeGreaterThan(0);

    const after = await prisma.stockLot.aggregate({
      where: { productId: product.id, status: "DISPONIVEL" },
      _sum: { quantity: true },
    });
    expect((after._sum.quantity ?? 0)).toBe((before._sum.quantity ?? 0) - 2);
  });

  it("bloqueia dispensação em agendamento CANCELADO para evitar baixa indevida", async () => {
    const prisma = getTestPrisma();
    const product = await prisma.medicalProduct.findFirstOrThrow({ where: { sku: "MAT-AGU25" } });
    const appointmentId = await createUniqueAppointment("Retorno cancelado pela paciente");

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELADO" },
    });

    await setSessionForEmail("dra.helena@bibi.health");
    const dispense = await materialsPost(
      jsonRequest(`http://localhost/api/prestador/appointments/${appointmentId}/materials`, {
        method: "POST",
        body: { productId: product.id, quantity: 1 },
      }),
      { params: Promise.resolve({ id: appointmentId }) },
    );
    expect(dispense.status).toBe(409);
    const body = await dispense.json();
    expect(body.error).toMatch(/cancelado/i);
  });

  it("segunda reversão do mesmo movimento retorna 400 — evita inflar saldo", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const prisma = getTestPrisma();
    const sku = `MAT-REV2-${Date.now().toString(36).toUpperCase()}`;
    const createRes = await productsPost(
      jsonRequest("http://localhost/api/interno/stock/products", {
        method: "POST",
        body: { sku, name: "Gaze estéril 10x10", category: "MATERIAL", minStock: 1 },
      }),
    );
    const productId = (await createRes.json()).product.id as string;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    const lotNumber = `LR-${Date.now().toString(36).toUpperCase()}`;
    await lotsPost(
      jsonRequest("http://localhost/api/interno/stock/lots", {
        method: "POST",
        body: {
          productId,
          lotNumber,
          quantity: 10,
          expiryDate: expiry.toISOString(),
          unitCost: 1.2,
        },
      }),
    );

    await movementsPost(
      jsonRequest("http://localhost/api/interno/stock/movements", {
        method: "POST",
        body: { productId, type: "SAIDA", quantity: 2, reason: "Uso em curativo" },
      }),
    );
    const saida = await prisma.stockMovement.findFirstOrThrow({
      where: { productId, type: "SAIDA" },
      orderBy: { createdAt: "desc" },
    });

    const first = await reverseMovementPost(
      jsonRequest(`http://localhost/api/interno/stock/movements/${saida.id}/reverse`, {
        method: "POST",
        body: { reason: "Estorno correto" },
      }),
      { params: Promise.resolve({ id: saida.id }) },
    );
    expect(first.status).toBe(200);

    const second = await reverseMovementPost(
      jsonRequest(`http://localhost/api/interno/stock/movements/${saida.id}/reverse`, {
        method: "POST",
        body: { reason: "Tentativa duplicada" },
      }),
      { params: Promise.resolve({ id: saida.id }) },
    );
    expect(second.status).toBe(400);
    const body = await second.json();
    expect(body.error).toMatch(/já foi revertida/i);

    const list = await movementsGet(
      jsonRequest("http://localhost/api/interno/stock/movements?limit=20"),
    );
    expect(list.status).toBe(200);
    const data = await list.json();
    const listed = data.movements.find((m: { id: string }) => m.id === saida.id);
    expect(listed?.reversed).toBe(true);
  });

  it("FIFO ignora lote vencido ainda marcado DISPONIVEL após refresh na baixa", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const prisma = getTestPrisma();
    const sku = `MAT-VENC-${Date.now().toString(36).toUpperCase()}`;
    const createRes = await productsPost(
      jsonRequest("http://localhost/api/interno/stock/products", {
        method: "POST",
        body: { sku, name: "Luvas procedimento M", category: "MATERIAL", minStock: 1 },
      }),
    );
    const productId = (await createRes.json()).product.id as string;
    const product = await prisma.medicalProduct.findFirstOrThrow({ where: { id: productId } });
    const past = new Date();
    past.setDate(past.getDate() - 10);
    const lotNumber = `LV-${Date.now().toString(36).toUpperCase()}`;

    await prisma.stockLot.create({
      data: {
        tenantId: product.tenantId,
        productId,
        lotNumber,
        expiryDate: past,
        quantity: 5,
        unitCost: 0.5,
        status: "DISPONIVEL",
      },
    });

    const saida = await movementsPost(
      jsonRequest("http://localhost/api/interno/stock/movements", {
        method: "POST",
        body: { productId, type: "SAIDA", quantity: 1, reason: "Tentativa em lote vencido" },
      }),
    );
    expect(saida.status).toBe(400);
    const body = await saida.json();
    expect(body.error).toMatch(/insuficiente/i);

    const lot = await prisma.stockLot.findFirstOrThrow({ where: { productId, lotNumber } });
    expect(lot.status).toBe("VENCIDO");
  });

  it("reforço de entrada rejeita lote em QUARENTENA — não reabre sem liberação", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const prisma = getTestPrisma();
    const sku = `MAT-QUA-${Date.now().toString(36).toUpperCase()}`;
    const createRes = await productsPost(
      jsonRequest("http://localhost/api/interno/stock/products", {
        method: "POST",
        body: { sku, name: "Álcool 70% 1L", category: "INSUMO", minStock: 1 },
      }),
    );
    const productId = (await createRes.json()).product.id as string;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    const lotNumber = `LQ-${Date.now().toString(36).toUpperCase()}`;
    const lotRes = await lotsPost(
      jsonRequest("http://localhost/api/interno/stock/lots", {
        method: "POST",
        body: {
          productId,
          lotNumber,
          quantity: 3,
          expiryDate: expiry.toISOString(),
          unitCost: 8,
        },
      }),
    );
    expect(lotRes.status).toBe(200);
    const lotRow = await prisma.stockLot.findFirstOrThrow({ where: { productId, lotNumber } });

    await lotPatch(
      jsonRequest(`http://localhost/api/interno/stock/lots/${lotRow.id}`, {
        method: "PATCH",
        body: { status: "QUARENTENA" },
      }),
      { params: Promise.resolve({ id: lotRow.id }) },
    );

    const reinforce = await lotsPost(
      jsonRequest("http://localhost/api/interno/stock/lots", {
        method: "POST",
        body: {
          productId,
          lotNumber,
          quantity: 2,
          expiryDate: expiry.toISOString(),
          unitCost: 8,
        },
      }),
    );
    expect(reinforce.status).toBe(400);
    const body = await reinforce.json();
    expect(body.error).toMatch(/QUARENTENA/i);

    const lot = await prisma.stockLot.findFirstOrThrow({ where: { id: lotRow.id } });
    expect(lot.quantity).toBe(3);
    expect(lot.status).toBe("QUARENTENA");
  });
});
