import { describe, expect, it } from "vitest";
import {
  buildInterchangeDataset,
  convertInterchangeContent,
  parseCsvRows,
  parseInterchangeContent,
  serializeInterchangeDataset,
} from "@/lib/imports/interchange";
import { getImportColumns } from "@/lib/imports/schemas";

describe("imports.interchange", () => {
  const columns = getImportColumns("patients");

  it("serializa e parseia JSON canônico", () => {
    const dataset = buildInterchangeDataset({
      entity: "patients",
      columns,
      rows: [{ name: "Maria", cpf: "529.982.247-25", birthDate: "1990-01-01" }],
    });
    const json = serializeInterchangeDataset(dataset, "json");
    const parsed = parseInterchangeContent(json, "json", "patients", columns);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.dataset.rows).toHaveLength(1);
      expect(parsed.dataset.rows[0].name).toBe("Maria");
    }
  });

  it("serializa e parseia CSV com cabeçalhos em português", () => {
    const csv = [
      "nome,cpf,data_nascimento",
      "Maria Silva,529.982.247-25,1990-05-15",
    ].join("\n");
    const parsed = parseInterchangeContent(csv, "csv", "patients", columns);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.dataset.rows[0].name).toBe("Maria Silva");
      expect(parsed.dataset.rows[0].birthDate).toBe("1990-05-15");
    }
  });

  it("converte CSV para JSON e vice-versa", () => {
    const csv = "nome,cpf,data_nascimento\nJoão,529.982.247-25,1985-03-10";
    const toJson = convertInterchangeContent({
      content: csv,
      from: "csv",
      to: "json",
      entity: "patients",
      columns,
    });
    expect(toJson.ok).toBe(true);
    if (!toJson.ok || !toJson.content) return;

    const toCsv = convertInterchangeContent({
      content: toJson.content,
      from: "json",
      to: "csv",
      entity: "patients",
      columns,
    });
    expect(toCsv.ok).toBe(true);
    if (toCsv.ok && toCsv.content) {
      expect(toCsv.content).toContain("nome,cpf,data_nascimento");
      expect(toCsv.content).toContain("João");
    }
  });

  it("parseia CSV com aspas e vírgulas", () => {
    const rows = parseCsvRows('"Nome, completo",cpf\n"Silva, Maria",123');
    expect(rows).toEqual([
      ["Nome, completo", "cpf"],
      ["Silva, Maria", "123"],
    ]);
  });

  it("rejeita colunas CSV desconhecidas", () => {
    const parsed = parseInterchangeContent("foo,bar\n1,2", "csv", "patients", columns);
    expect(parsed.ok).toBe(false);
  });
});
