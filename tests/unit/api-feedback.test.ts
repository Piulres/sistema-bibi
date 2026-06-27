import { describe, expect, it } from "vitest";
import { apiErrorMessage } from "@/lib/ui/api-feedback";

describe("api-feedback", () => {
  it("prioriza mensagem do corpo da API", () => {
    expect(apiErrorMessage(400, { error: "CPF inválido" })).toBe("CPF inválido");
  });

  it("mapeia status HTTP para mensagens amigáveis", () => {
    expect(apiErrorMessage(403, {})).toMatch(/permissão/i);
    expect(apiErrorMessage(404, null)).toMatch(/não encontrado/i);
    expect(apiErrorMessage(500, {})).toMatch(/interno/i);
  });

  it("usa fallback customizado", () => {
    expect(apiErrorMessage(418, {}, "Falha ao agendar")).toBe("Falha ao agendar");
  });
});
