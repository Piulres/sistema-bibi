import type { PrismaClient } from "@prisma/client";
import type { NicheId } from "../../src/lib/niche/types";

type ProductSeed = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  minStock: number;
  anvisaCode?: string;
};

const STOCK_BY_NICHE: Record<NicheId, ProductSeed[]> = {
  MEDICAL: [],
  VET: [
    { sku: "VET-VAC-V10", name: "Vacina V10 — dose", category: "MEDICAMENTO", unit: "UN", minStock: 20 },
    { sku: "VET-ANTP-SPOT", name: "Antiparasitário spot-on 4-10kg", category: "MEDICAMENTO", unit: "UN", minStock: 30 },
    { sku: "VET-SHAMPOO", name: "Shampoo neutro pet 500ml", category: "INSUMO", unit: "UN", minStock: 15 },
    { sku: "VET-LUVA-M", name: "Luva procedimento — M", category: "MATERIAL", unit: "PC", minStock: 80 },
    { sku: "VET-SORO", name: "Soro fisiológico 500ml", category: "INSUMO", unit: "UN", minStock: 12 },
  ],
  DENTAL: [
    { sku: "DEN-RESINA-A2", name: "Resina composta A2 — seringa", category: "MATERIAL", unit: "UN", minStock: 25 },
    { sku: "DEN-BROCA", name: "Broca diamantada FG — kit", category: "MATERIAL", unit: "KIT", minStock: 10 },
    { sku: "DEN-ANEST", name: "Anestésico local — carpule", category: "MEDICAMENTO", unit: "UN", minStock: 40 },
    { sku: "DEN-LUVA", name: "Luva nitrílica — M", category: "MATERIAL", unit: "PC", minStock: 100 },
  ],
  LEGAL: [
    { sku: "LEG-DOC-SCAN", name: "Créditos digitalização processual", category: "SERVICO", unit: "UN", minStock: 50 },
    { sku: "LEG-CERT-A1", name: "Certificado digital A1 — unidade", category: "MATERIAL", unit: "UN", minStock: 5 },
  ],
  SPA: [
    { sku: "SPA-OLEO-REL", name: "Óleo essencial relaxante 250ml", category: "INSUMO", unit: "UN", minStock: 8 },
    { sku: "SPA-TOALHA", name: "Toalha felpuda — unidade", category: "MATERIAL", unit: "UN", minStock: 40 },
    { sku: "SPA-CREME-FAC", name: "Máscara facial hidratante", category: "INSUMO", unit: "UN", minStock: 12 },
  ],
  EDUCATION: [
    { sku: "EDU-MAT-APOIO", name: "Kit material didático — unidade", category: "MATERIAL", unit: "KIT", minStock: 30 },
    { sku: "EDU-LIC-ZOOM", name: "Licença sala virtual — mês", category: "SERVICO", unit: "UN", minStock: 10 },
  ],
  CONSTRUCTION: [
    { sku: "ENG-CIM-CP", name: "Cimento CP-II 50kg", category: "MATERIAL", unit: "SC", minStock: 40 },
    { sku: "ENG-AREIA", name: "Areia média — m³", category: "MATERIAL", unit: "M3", minStock: 10 },
    { sku: "ENG-EPI-CAP", name: "Capacete EPI — unidade", category: "MATERIAL", unit: "UN", minStock: 25 },
    { sku: "ENG-TINTA", name: "Tinta acrílica 18L", category: "INSUMO", unit: "UN", minStock: 8 },
  ],
};

/** Estoque por segmento — insumos típicos da operação diária. */
export async function seedNicheStock(
  prisma: PrismaClient,
  tenantId: string,
  niche: NicheId,
): Promise<number> {
  const products = STOCK_BY_NICHE[niche];
  if (!products?.length) return 0;

  let count = 0;
  for (const p of products) {
    const created = await prisma.medicalProduct.create({
      data: {
        sku: p.sku,
        name: p.name,
        category: p.category,
        unit: p.unit,
        minStock: p.minStock,
        anvisaCode: p.anvisaCode ?? null,
        tenantId,
      },
    });

    await prisma.stockLot.create({
      data: {
        productId: created.id,
        lotNumber: `LOT-${p.sku}-001`,
        quantity: p.minStock * 3,
        expiryDate: new Date(Date.now() + 180 * 86_400_000),
        tenantId,
      },
    });

    await prisma.stockMovement.create({
      data: {
        productId: created.id,
        type: "ENTRADA",
        quantity: p.minStock * 3,
        reason: "Estoque inicial seed",
        tenantId,
      },
    });
    count += 1;
  }
  return count;
}
