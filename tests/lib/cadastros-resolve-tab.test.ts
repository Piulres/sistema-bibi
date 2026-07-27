import { describe, expect, it } from "vitest";
import { resolveCadastrosTab } from "@/lib/cadastros/resolve-tab";

describe("resolveCadastrosTab — evita aba inválida na URL de cadastros", () => {
  const medicalKeys = [
    "patients",
    "companies",
    "procedures",
    "pricing",
    "protocols",
    "users",
    "operations",
  ];

  it("usa a aba da URL quando ela existe no nicho (deep-link operacional)", () => {
    expect(resolveCadastrosTab("procedures", medicalKeys)).toBe("procedures");
    expect(resolveCadastrosTab("users", medicalKeys)).toBe("users");
  });

  it("cai em patients quando a aba não existe no nicho (ex.: pets fora de VET)", () => {
    expect(resolveCadastrosTab("pets", medicalKeys)).toBe("patients");
    expect(resolveCadastrosTab("inexistente", medicalKeys)).toBe("patients");
  });

  it("cai em patients quando tab ausente ou vazia (entrada padrão da tela)", () => {
    expect(resolveCadastrosTab(null, medicalKeys)).toBe("patients");
    expect(resolveCadastrosTab(undefined, medicalKeys)).toBe("patients");
  });

  it("aceita pets quando o nicho VET expõe a aba (tutor/animal separados)", () => {
    const vetKeys = [...medicalKeys.slice(0, 1), "pets", ...medicalKeys.slice(1)];
    expect(resolveCadastrosTab("pets", vetKeys)).toBe("pets");
  });
});
