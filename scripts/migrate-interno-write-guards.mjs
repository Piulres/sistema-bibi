#!/usr/bin/env node
/**
 * Migra handlers mutaveis (POST/PUT/PATCH/DELETE) de requireInternoModule
 * para requireInternoModuleWrite em rotas internas route.ts
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const API_ROOT = join(process.cwd(), "src/app/api/interno");
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const SKIP_FILES = new Set([
  // Já usam requireInternoAdmin
  join(API_ROOT, "users/route.ts"),
  join(API_ROOT, "users/[id]/route.ts"),
]);

function listRouteFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...listRouteFiles(full));
    else if (entry === "route.ts") files.push(full);
  }
  return files;
}

/** Extrai blocos `export async function METHOD(...) { ... }` no nível top. */
function extractHandlerBlocks(source) {
  const blocks = [];
  const re = /export async function (GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\)\s*\{/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const method = m[1];
    const start = m.index;
    let depth = 0;
    let i = m.index + m[0].length - 1;
    for (; i < source.length; i++) {
      const ch = source[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          blocks.push({
            method,
            start,
            end: i + 1,
            body: source.slice(start, i + 1),
          });
          break;
        }
      }
    }
  }
  return blocks;
}

function migrateFile(filePath) {
  if (SKIP_FILES.has(filePath)) return { changed: false, reason: "skip-admin" };

  let source = readFileSync(filePath, "utf8");
  if (!source.includes("requireInternoModule")) {
    return { changed: false, reason: "no-module-guard" };
  }

  const blocks = extractHandlerBlocks(source);
  let offset = 0;
  let anyWrite = false;

  for (const block of blocks) {
    if (!MUTATING.has(block.method)) continue;
    if (!block.body.includes("requireInternoModule(")) continue;
    if (block.body.includes("requireInternoModuleWrite(")) continue;

    const newBody = block.body.replace(
      /requireInternoModule\(/g,
      "requireInternoModuleWrite(",
    );
    if (newBody === block.body) continue;

    anyWrite = true;
    const adjStart = block.start + offset;
    const adjEnd = block.end + offset;
    source = source.slice(0, adjStart) + newBody + source.slice(adjEnd);
    offset += newBody.length - block.body.length;
  }

  if (!anyWrite) return { changed: false, reason: "already-migrated" };

  // Garante import de requireInternoModuleWrite
  if (source.includes("requireInternoModuleWrite") && !source.match(/import[^;]*requireInternoModuleWrite/)) {
    source = source.replace(
      /import \{([^}]*)\} from "@\/lib\/api-auth";/,
      (match, imports) => {
        const parts = imports.split(",").map((s) => s.trim()).filter(Boolean);
        if (!parts.includes("requireInternoModuleWrite")) {
          parts.splice(1, 0, "requireInternoModuleWrite");
        }
        return `import { ${parts.join(", ")} } from "@/lib/api-auth";`;
      },
    );
  }

  writeFileSync(filePath, source);
  return { changed: true };
}

const files = listRouteFiles(API_ROOT);
const results = { changed: [], skipped: [] };

for (const file of files) {
  const r = migrateFile(file);
  if (r.changed) results.changed.push(file.replace(process.cwd() + "/", ""));
  else results.skipped.push({ file: file.replace(process.cwd() + "/", ""), ...r });
}

console.log(JSON.stringify(results, null, 2));
console.log(`\nMigrated ${results.changed.length} files`);
