import { describe, expect, it } from "vitest";
import { buildLeadWhatsAppMessage } from "@/lib/landing/lead-form";

describe("lead-form", () => {
  it("monta mensagem WhatsApp com dados do lead", () => {
    const message = buildLeadWhatsAppMessage({
      name: " Ana Silva ",
      company: "TechCorp",
      email: "ana@techcorp.com",
      segment: "MEDICAL",
      eligibleCount: 500,
      message: "Quero piloto 90 dias",
    });

    expect(message).toContain("Ana Silva");
    expect(message).toContain("TechCorp");
    expect(message).toContain("ana@techcorp.com");
    expect(message).toContain("Saúde");
    expect(message).toContain("Elegíveis: 500");
    expect(message).toContain("piloto 90 dias");
  });

  it("anexa UTM à mensagem quando informado", () => {
    const message = buildLeadWhatsAppMessage(
      {
        name: "João",
        company: "PetCo",
        email: "joao@pet.co",
        segment: "VET",
      },
      { source: "linkedin", campaign: "vet-q3" },
    );

    expect(message).toContain("linkedin");
    expect(message).toContain("vet-q3");
  });
});
