#!/usr/bin/env node
/**
 * Escreve resumo legível do Vitest em $GITHUB_STEP_SUMMARY (e stdout).
 * Entrada: reports/vitest-junit.xml (gerado pelo reporter junit no CI).
 */
import { existsSync, readFileSync, appendFileSync } from "node:fs";

const JUNIT = process.env.VITEST_JUNIT_PATH ?? "reports/vitest-junit.xml";
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

function esc(s) {
  return String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function parseJunit(xml) {
  const suites = [...xml.matchAll(/<testsuite\b([^>]*)>/g)].map((m) => {
    const attrs = Object.fromEntries(
      [...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((a) => [a[1], a[2]]),
    );
    return {
      name: attrs.name || "(suite)",
      tests: Number(attrs.tests || 0),
      failures: Number(attrs.failures || 0),
      errors: Number(attrs.errors || 0),
      skipped: Number(attrs.skipped || 0),
      time: Number(attrs.time || 0),
    };
  });

  const cases = [...xml.matchAll(/<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g)].map((m) => {
    const attrs = Object.fromEntries(
      [...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((a) => [a[1], a[2]]),
    );
    const body = m[2];
    const failed = /<failure\b|<error\b/.test(body);
    const skipped = /<skipped\b/.test(body);
    let message = "";
    const failMsg = body.match(/<(?:failure|error)\b[^>]*message="([^"]*)"/);
    if (failMsg) message = failMsg[1];
    return {
      classname: attrs.classname || "",
      name: attrs.name || "",
      time: Number(attrs.time || 0),
      failed,
      skipped,
      message,
    };
  });

  return { suites, cases };
}

function buildMarkdown({ suites, cases }) {
  const tests = cases.length;
  const failures = cases.filter((c) => c.failed).length;
  const skipped = cases.filter((c) => c.skipped).length;
  const passed = tests - failures - skipped;
  const duration = suites.reduce((s, x) => s + (x.time || 0), 0);

  const lines = [
    "## Vitest — resumo",
    "",
    `| Métrica | Valor |`,
    `|---|---:|`,
    `| Passou | ${passed} |`,
    `| Falhou | ${failures} |`,
    `| Pulado | ${skipped} |`,
    `| Total | ${tests} |`,
    `| Duração (s) | ${duration.toFixed(1)} |`,
    "",
  ];

  if (failures > 0) {
    lines.push("### Falhas", "");
    lines.push("| Suite / caso | Mensagem |");
    lines.push("|---|---|");
    for (const c of cases.filter((x) => x.failed).slice(0, 25)) {
      const title = esc(`${c.classname} › ${c.name}`.trim());
      lines.push(`| \`${title}\` | ${esc(c.message || "—")} |`);
    }
    lines.push("");
  } else {
    lines.push("> Todos os casos passaram. Títulos dos testes devem descrever **o quê** e **por quê** (regra em `.cursor/rules/tests.mdc`).", "");
  }

  // Top suites por quantidade (ajuda a ver cobertura no summary)
  const byClass = new Map();
  for (const c of cases) {
    const key = c.classname || "(sem suite)";
    const row = byClass.get(key) ?? { total: 0, failed: 0 };
    row.total += 1;
    if (c.failed) row.failed += 1;
    byClass.set(key, row);
  }
  const top = [...byClass.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 12);
  if (top.length > 0) {
    lines.push("### Suites (top)", "");
    lines.push("| Suite | Casos | Falhas |");
    lines.push("|---|---:|---:|");
    for (const [name, row] of top) {
      lines.push(`| \`${esc(name)}\` | ${row.total} | ${row.failed} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

if (!existsSync(JUNIT)) {
  const msg = `## Vitest — resumo\n\nArquivo JUnit não encontrado: \`${JUNIT}\`.\n`;
  if (summaryPath) appendFileSync(summaryPath, msg);
  console.error(msg);
  process.exit(0);
}

const xml = readFileSync(JUNIT, "utf8");
const md = buildMarkdown(parseJunit(xml));
if (summaryPath) appendFileSync(summaryPath, md);
console.log(md);
