import { describe, expect, it } from "vitest";
import {
  appendUtmToUrl,
  buildWhatsAppMessage,
  formatUtmForMessage,
  hasUtmParams,
  parseUtmParams,
} from "@/lib/marketing/utm";

describe("marketing.utm", () => {
  it("parseia parâmetros UTM da query string", () => {
    const utm = parseUtmParams("?utm_source=linkedin&utm_campaign=proposta-q2");
    expect(utm).toEqual({
      source: "linkedin",
      campaign: "proposta-q2",
    });
    expect(hasUtmParams(utm)).toBe(true);
  });

  it("anexa UTM a URL relativa", () => {
    const url = appendUtmToUrl("/venda", {
      source: "google",
      medium: "cpc",
      campaign: "health-b2b",
    });
    expect(url).toContain("utm_source=google");
    expect(url).toContain("utm_medium=cpc");
    expect(url).toContain("utm_campaign=health-b2b");
  });

  it("formata linha de campanha para mensagem", () => {
    const line = formatUtmForMessage({
      source: "linkedin",
      campaign: "proposta-q2",
    });
    expect(line).toContain("Campanha: proposta-q2");
    expect(line).toContain("Origem: linkedin");
  });

  it("combina mensagem base com UTM", () => {
    const message = buildWhatsAppMessage("Olá!", {
      campaign: "proposta-q2",
      source: "email",
    });
    expect(message).toMatch(/^Olá!/);
    expect(message).toContain("proposta-q2");
  });
});
