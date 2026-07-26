import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as tissGet } from "@/app/api/interno/invoices/[id]/tiss/route";
import { escapeXml } from "@/lib/tiss-service";
import { getTestPrisma } from "../helpers/db";
import { getPedroPaidInvoice } from "../helpers/seed-fixtures";
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

function getGuide(id: string) {
  return tissGet(new Request(`http://localhost/api/interno/invoices/${id}/tiss`), {
    params: Promise.resolve({ id }),
  });
}

describe("TISS — guia XML da fatura", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("gera guia bem-formada para fatura com procedimentos", async () => {
    const prisma = getTestPrisma();
    const invoice = await getPedroPaidInvoice();
    const items = await prisma.invoiceItem.count({ where: { invoiceId: invoice.id } });
    expect(items).toBeGreaterThan(0);

    await setSessionForEmail("financeiro@bibi.health");
    const res = await getGuide(invoice.id);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/xml");

    const xml = await res.text();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<ans:mensagemTISS");
    expect(xml).toContain(`<ans:numeroGuiaPrestador>${invoice.id}</ans:numeroGuiaPrestador>`);
    expect(xml).toContain(`<ans:valorTotalGeral>${invoice.total.toFixed(2)}</ans:valorTotalGeral>`);
    expect(xml.match(/<procedimento sequencial=/g)?.length).toBe(items);
    // Carteira preenchida (CPF sem máscara)
    expect(xml).not.toContain("<ans:numeroCarteira></ans:numeroCarteira>");
  });

  it("rejeita fatura sem procedimentos com 422 (NO_ITEMS)", async () => {
    const prisma = getTestPrisma();
    const paid = await getPedroPaidInvoice();
    const empty = await prisma.invoice.create({
      data: {
        tenantId: paid.tenantId,
        patientId: paid.patientId,
        status: "FECHADA",
        total: 0,
      },
    });

    await setSessionForEmail("financeiro@bibi.health");
    const res = await getGuide(empty.id);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe("NO_ITEMS");

    await prisma.invoice.delete({ where: { id: empty.id } });
  });

  it("nega perfil sem módulo billing (RECEPCAO) com 403", async () => {
    const invoice = await getPedroPaidInvoice();
    await setSessionForEmail("recepcao@bibi.health");
    const res = await getGuide(invoice.id);
    expect(res.status).toBe(403);
  });

  it("retorna 404 para fatura inexistente ou de outro tenant", async () => {
    await setSessionForEmail("financeiro@bibi.health");
    const res = await getGuide("inexistente-123");
    expect(res.status).toBe(404);
  });
});

describe("TISS — escapeXml", () => {
  it("escapa os cinco caracteres reservados do XML", () => {
    expect(escapeXml(`Silva & Filhos <Ltda> "aspas" 'apóstrofo'`)).toBe(
      "Silva &amp; Filhos &lt;Ltda&gt; &quot;aspas&quot; &apos;apóstrofo&apos;",
    );
  });
});
