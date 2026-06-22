import { describe, expect, it } from "vitest";
import { MockPixAdapter } from "@/lib/payments/adapters/mock-pix-adapter";

describe("MockPixAdapter", () => {
  const adapter = new MockPixAdapter();

  it("cria cobrança PIX com payload BR Code", async () => {
    const result = await adapter.createPixCharge({
      amount: { amount: 199.9, currency: "BRL" },
      reference: { invoiceId: "inv-1" },
      payer: { name: "João", document: "12345678900" },
      expiresInSeconds: 3600,
    });

    expect(result.gatewayId).toBe("mock");
    expect(result.status).toBe("PENDING");
    expect(result.pixCopyPaste).toContain("BR.GOV.BCB.PIX");
    expect(result.qrCodePayload).toContain("mock-qr:");
    expect(result.expiresAt!.getTime()).toBeGreaterThan(Date.now());
  });

  it("externalId referencia a fatura", async () => {
    const req = {
      amount: { amount: 50, currency: "BRL" as const },
      reference: { invoiceId: "inv-2" },
      payer: { name: "Maria", document: "98765432100" },
    };
    const charge = await adapter.createPixCharge(req);
    expect(charge.externalId).toContain("inv-2");
    expect(charge.externalId).toMatch(/^mock_pix_/);
  });
});
