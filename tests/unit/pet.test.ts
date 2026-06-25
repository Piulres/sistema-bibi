import { describe, expect, it } from "vitest";
import { requiresPet } from "@/lib/vet-niche";
import { isPetSpecies, PET_SPECIES_LABELS } from "@/lib/pet-constants";

describe("vet-niche.requiresPet", () => {
  it("exige pet apenas no nicho VET", () => {
    expect(requiresPet("VET")).toBe(true);
    expect(requiresPet("MEDICAL")).toBe(false);
    expect(requiresPet("DENTAL")).toBe(false);
  });
});

describe("pet-constants", () => {
  it("valida espécies canônicas", () => {
    expect(isPetSpecies("CANINO")).toBe(true);
    expect(isPetSpecies("CANIDE")).toBe(false);
    expect(PET_SPECIES_LABELS.CANINO).toBe("Canino");
  });
});
