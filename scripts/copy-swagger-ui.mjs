#!/usr/bin/env node
/**
 * Copia assets do swagger-ui-dist para public/swagger-ui/ (self-hosted, compatível com CSP).
 * Executado no postinstall e antes do build.
 */
import { copyFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(ROOT, "..");
const sourceDir = join(projectRoot, "node_modules", "swagger-ui-dist");
const targetDir = join(projectRoot, "public", "swagger-ui");

const ASSETS = [
  "swagger-ui.css",
  "swagger-ui-bundle.js",
  "swagger-ui-standalone-preset.js",
  "oauth2-redirect.html",
  "favicon-16x16.png",
  "favicon-32x32.png",
];

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

try {
  statSync(sourceDir);
} catch {
  console.warn("copy-swagger-ui: swagger-ui-dist não instalado — pulando.");
  process.exit(0);
}

ensureDir(targetDir);

for (const file of ASSETS) {
  const from = join(sourceDir, file);
  const to = join(targetDir, file);
  try {
    copyFileSync(from, to);
  } catch {
    console.warn(`copy-swagger-ui: asset ausente — ${file}`);
  }
}

// Mapas de source (opcionais, úteis para debug)
for (const entry of readdirSync(sourceDir)) {
  if (entry.endsWith(".map")) {
    try {
      copyFileSync(join(sourceDir, entry), join(targetDir, entry));
    } catch {
      // opcional
    }
  }
}

console.log(`copy-swagger-ui: ${ASSETS.length} assets em public/swagger-ui/`);
