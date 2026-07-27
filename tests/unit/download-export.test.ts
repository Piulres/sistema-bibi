import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildExportUrl,
  downloadExportFile,
  parseContentDispositionFilename,
  sanitizeDownloadFilename,
} from "@/lib/ui/download-export";

describe("buildExportUrl", () => {
  it("monta query com format e filtros", () => {
    expect(buildExportUrl("/api/interno/billing/export", { month: "2026-01" }, "pdf")).toBe(
      "/api/interno/billing/export?month=2026-01&format=pdf",
    );
  });

  it("ignora valores vazios e omite query quando vazia", () => {
    expect(buildExportUrl("/api/export", { section: undefined, q: "" })).toBe("/api/export");
    expect(buildExportUrl("/api/export", {}, "csv")).toBe("/api/export?format=csv");
  });
});

describe("sanitizeDownloadFilename — evita path separators que quebram o download no Chrome", () => {
  it("substitui barra de mês (07/2026) por hífen", () => {
    expect(sanitizeDownloadFilename("gestao-clinica-07/2026.pdf", "export.pdf")).toBe(
      "gestao-clinica-07-2026.pdf",
    );
  });

  it("retorna fallback quando nome fica vazio", () => {
    expect(sanitizeDownloadFilename("///", "export.pdf")).toBe("export.pdf");
  });
});

describe("parseContentDispositionFilename", () => {
  it("decodifica filename* UTF-8", () => {
    const header = `attachment; filename="relatorio.pdf"; filename*=UTF-8''relat%C3%B3rio%20mar%C3%A7o.pdf`;
    expect(parseContentDispositionFilename(header, "fallback.pdf")).toBe("relatório março.pdf");
  });

  it("usa filename quoted ou plain", () => {
    expect(parseContentDispositionFilename('attachment; filename="fatura.xlsx"', "x")).toBe(
      "fatura.xlsx",
    );
    expect(parseContentDispositionFilename("attachment; filename=export.csv", "x")).toBe(
      "export.csv",
    );
  });

  it("retorna fallback quando header ausente ou inválido", () => {
    expect(parseContentDispositionFilename(null, "export.pdf")).toBe("export.pdf");
    expect(parseContentDispositionFilename("inline", "export.pdf")).toBe("export.pdf");
  });

  it("sanitiza filename com barra (Content-Disposition de gestão clínica)", () => {
    const header =
      'attachment; filename="gestao-clinica-07/2026.pdf"; filename*=UTF-8\'\'gestao-clinica-07%2F2026.pdf';
    expect(parseContentDispositionFilename(header, "export.pdf")).toBe(
      "gestao-clinica-07-2026.pdf",
    );
  });
});

describe("downloadExportFile", () => {
  const originalFetch = globalThis.fetch;
  const click = vi.fn();
  const remove = vi.fn();
  const revokeObjectURL = vi.fn();
  const createObjectURL = vi.fn(() => "blob:mock");

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL,
    });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        click,
        remove,
        style: {},
      })),
      body: {
        appendChild: vi.fn(),
      },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("baixa blob e dispara anchor quando resposta ok", async () => {
    const blob = new Blob(["pdf-content"], { type: "application/pdf" });
    vi.mocked(fetch).mockResolvedValue(
      new Response(blob, {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'attachment; filename="relatorio.pdf"',
        },
      }),
    );

    const result = await downloadExportFile("/api/export?format=pdf", "export.pdf");

    expect(result).toEqual({ ok: true, filename: "relatorio.pdf" });
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("propaga erro JSON da API", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await downloadExportFile("/api/export");

    expect(result).toEqual({
      ok: false,
      error: "Sem permissão",
      status: 403,
    });
    expect(click).not.toHaveBeenCalled();
  });

  it("baixa JSON tabular 200 (application/json) sem consumir o body duas vezes", async () => {
    const payload = JSON.stringify({ title: "Gestão clínica", rows: [{ a: 1 }] });
    vi.mocked(fetch).mockResolvedValue(
      new Response(payload, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition":
            'attachment; filename="gestao-clinica-2026-07.json"; filename*=UTF-8\'\'gestao-clinica-2026-07.json',
        },
      }),
    );

    const result = await downloadExportFile("/api/export?format=json", "export.json");

    expect(result).toEqual({ ok: true, filename: "gestao-clinica-2026-07.json" });
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });

  it("rejeita blob vazio", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(new Blob([]), {
        status: 200,
        headers: { "content-type": "application/pdf" },
      }),
    );

    const result = await downloadExportFile("/api/export");

    expect(result).toEqual({
      ok: false,
      error: "Arquivo de exportação vazio.",
      status: 200,
    });
  });

  it("trata falha de rede", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));

    const result = await downloadExportFile("/api/export");

    expect(result).toEqual({
      ok: false,
      error: "Falha de rede ao exportar.",
      status: 0,
    });
  });
});
