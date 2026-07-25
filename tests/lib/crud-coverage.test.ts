import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CRUD_OPERATIONS_MAP } from "@/lib/crud-operations-map";
import { CRUD_COVERAGE_REGISTRY } from "./crud-coverage-registry";

describe("cobertura CRUD do sistema", () => {
  it("toda entidade do mapa canônico tem entrada no registro de testes", () => {
    const covered = new Set(CRUD_COVERAGE_REGISTRY.map((e) => e.entity));
    const missing = CRUD_OPERATIONS_MAP.map((e) => e.entity).filter((name) => !covered.has(name));
    expect(missing, `Entidades sem cobertura declarada: ${missing.join(", ")}`).toEqual([]);
  });

  it("registro não aponta entidades fantasmas", () => {
    const known = new Set(CRUD_OPERATIONS_MAP.map((e) => e.entity));
    const orphans = CRUD_COVERAGE_REGISTRY.map((e) => e.entity).filter((name) => !known.has(name));
    expect(orphans).toEqual([]);
  });

  it("arquivos de teste referenciados existem no repositório", () => {
    const root = resolve(process.cwd());
    const missingFiles: string[] = [];
    for (const entry of CRUD_COVERAGE_REGISTRY) {
      expect(entry.tests.length).toBeGreaterThan(0);
      for (const rel of entry.tests) {
        if (!existsSync(resolve(root, rel))) {
          missingFiles.push(`${entry.entity} → ${rel}`);
        }
      }
    }
    expect(missingFiles, missingFiles.join("\n")).toEqual([]);
  });
});
