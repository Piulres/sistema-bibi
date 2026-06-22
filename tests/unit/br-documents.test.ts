import { describe, expect, it } from "vitest";
import {
  formatCnpj,
  formatCpf,
  isValidCnpj,
  isValidCpf,
  normalizeCnpj,
  normalizeCpf,
} from "@/lib/validation/br-documents";

describe("br-documents", () => {
  it("valida CPF conhecido", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });

  it("valida CNPJ conhecido", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("00.000.000/0000-00")).toBe(false);
  });

  it("normaliza e formata", () => {
    expect(normalizeCpf("529.982.247-25")).toBe("52998224725");
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
    expect(normalizeCnpj("11.222.333/0001-81")).toBe("11222333000181");
    expect(formatCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });
});
