import { describe, expect, it } from "vitest";
import {
  buildWhatsAppUrl,
  getSalesWhatsAppConfig,
  normalizeWhatsAppNumber,
} from "@/lib/landing/whatsapp";

describe("landing.whatsapp", () => {
  it("normaliza número E.164 para wa.me", () => {
    expect(normalizeWhatsAppNumber("+55 (11) 97082-8949")).toBe("5511970828949");
  });

  it("monta URL wa.me com mensagem codificada", () => {
    const url = buildWhatsAppUrl("5511970828949", "Olá ServiceOS");
    expect(url).toBe("https://wa.me/5511970828949?text=Ol%C3%A1%20ServiceOS");
  });

  it("retorna null sem env configurada", () => {
    const original = process.env.NEXT_PUBLIC_SALES_WHATSAPP;
    delete process.env.NEXT_PUBLIC_SALES_WHATSAPP;
    expect(getSalesWhatsAppConfig()).toBeNull();
    process.env.NEXT_PUBLIC_SALES_WHATSAPP = original;
  });

  it("lê config com número e mensagem padrão", () => {
    const originalNumber = process.env.NEXT_PUBLIC_SALES_WHATSAPP;
    const originalMessage = process.env.NEXT_PUBLIC_SALES_WHATSAPP_MESSAGE;
    process.env.NEXT_PUBLIC_SALES_WHATSAPP = "+5511970828949";
    delete process.env.NEXT_PUBLIC_SALES_WHATSAPP_MESSAGE;

    const config = getSalesWhatsAppConfig();
    expect(config?.number).toBe("5511970828949");
    expect(config?.defaultMessage).toContain("especialista");

    process.env.NEXT_PUBLIC_SALES_WHATSAPP = originalNumber;
    process.env.NEXT_PUBLIC_SALES_WHATSAPP_MESSAGE = originalMessage;
  });
});
