import type { PrismaClient } from "@prisma/client";

type ProcedureRef = { id: string; code: string };

/** Massa demo de estoque médico — medicamentos, materiais e kits por procedimento. */
export async function seedMedicalStock(
  prisma: PrismaClient,
  tenantId: string,
  procedures: Record<string, ProcedureRef>,
) {
  const products = [
    {
      sku: "MED-DIP500",
      name: "Dipirona 500mg — ampola 2ml",
      category: "MEDICAMENTO",
      unit: "UN",
      minStock: 20,
      anvisaCode: "101070001",
    },
    {
      sku: "MAT-LUVA-M",
      name: "Luva de procedimento — tamanho M",
      category: "MATERIAL",
      unit: "PC",
      minStock: 100,
    },
    {
      sku: "MAT-SORO500",
      name: "Soro fisiológico 0,9% — 500ml",
      category: "INSUMO",
      unit: "UN",
      minStock: 15,
    },
    {
      sku: "MAT-AGU25",
      name: "Agulha 25x7 descartável",
      category: "MATERIAL",
      unit: "UN",
      minStock: 50,
    },
    {
      sku: "OPME-LANCETA",
      name: "Lanceta para capilar — estéril",
      category: "OPME",
      unit: "UN",
      minStock: 30,
    },
    {
      sku: "MAT-GAZE",
      name: "Gaze estéril 7,5x7,5cm",
      category: "MATERIAL",
      unit: "PC",
      minStock: 40,
    },
  ] as const;

  const productIds: Record<string, string> = {};

  for (const p of products) {
    const created = await prisma.medicalProduct.create({
      data: { ...p, tenantId },
    });
    productIds[p.sku] = created.id;
  }

  const now = new Date();
  const addMonths = (months: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const lots = [
    { sku: "MED-DIP500", lot: "LOT2026A", qty: 48, expiry: addMonths(14), cost: 1.2 },
    { sku: "MAT-LUVA-M", lot: "LUV2401", qty: 500, expiry: addMonths(24), cost: 0.35 },
    { sku: "MAT-SORO500", lot: "SF500-26", qty: 30, expiry: addMonths(18), cost: 4.5 },
    { sku: "MAT-AGU25", lot: "AG25-1126", qty: 200, expiry: addMonths(36), cost: 0.15 },
    { sku: "OPME-LANCETA", lot: "LAN-8842", qty: 80, expiry: addMonths(12), cost: 0.45 },
    { sku: "MAT-GAZE", lot: "GAZ-7720", qty: 120, expiry: addMonths(20), cost: 0.25 },
    { sku: "MED-DIP500", lot: "LOT2025Z", qty: 6, expiry: addMonths(2), cost: 1.1 },
  ];

  for (const lot of lots) {
    const productId = productIds[lot.sku]!;
    const stockLot = await prisma.stockLot.create({
      data: {
        tenantId,
        productId,
        lotNumber: lot.lot,
        expiryDate: lot.expiry,
        quantity: lot.qty,
        unitCost: lot.cost,
        status: lot.expiry < now ? "VENCIDO" : "DISPONIVEL",
      },
    });

    await prisma.stockMovement.create({
      data: {
        tenantId,
        productId,
        lotId: stockLot.id,
        type: "ENTRADA",
        quantity: lot.qty,
        unitCost: lot.cost,
        reason: `Entrada inicial demo — lote ${lot.lot}`,
      },
    });
  }

  const consulta = procedures["CON-CLM"];
  const hemograma = procedures["EXA-HEM"];

  if (consulta) {
    await prisma.procedureMaterialKit.createMany({
      data: [
        { tenantId, procedureId: consulta.id, productId: productIds["MAT-LUVA-M"]!, quantity: 2 },
        { tenantId, procedureId: consulta.id, productId: productIds["MAT-GAZE"]!, quantity: 1 },
      ],
    });
  }

  if (hemograma) {
    await prisma.procedureMaterialKit.createMany({
      data: [
        { tenantId, procedureId: hemograma.id, productId: productIds["OPME-LANCETA"]!, quantity: 1 },
        { tenantId, procedureId: hemograma.id, productId: productIds["MAT-LUVA-M"]!, quantity: 1 },
      ],
    });
  }

  return { productCount: products.length, lotCount: lots.length };
}
