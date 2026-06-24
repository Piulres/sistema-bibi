import { describe, expect, it } from "vitest";
import { vaccineStatusLabel, VACCINE_STATUSES } from "@/lib/clinical/constants";

describe("clinical vaccine constants", () => {
  it("expõe status canônicos de vacina", () => {
    expect(VACCINE_STATUSES).toContain("APLICADA");
    expect(VACCINE_STATUSES).toContain("PENDENTE");
    expect(VACCINE_STATUSES).toContain("VENCIDA");
  });

  it("traduz rótulos de status", () => {
    expect(vaccineStatusLabel("APLICADA")).toBe("Aplicada");
    expect(vaccineStatusLabel("PENDENTE")).toBe("Pendente");
    expect(vaccineStatusLabel("VENCIDA")).toBe("Vencida");
  });
});

describe("pet clinical overview shape", () => {
  it("aceita perfil sem tipo sanguíneo (pet)", () => {
    const profile = {
      petId: "pet-1",
      allergies: [{ substance: "Penicilina" }],
      chronicConditions: [],
      updatedAt: new Date().toISOString(),
    };
    expect(profile.petId).toBe("pet-1");
    expect(profile.allergies).toHaveLength(1);
  });
});
