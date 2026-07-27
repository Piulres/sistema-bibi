#!/usr/bin/env node
/**
 * Prepara recursos nativos Capacitor a partir da BrandMark (icon + splash).
 * Requer: npm run icons:generate
 *
 * Uso: node scripts/setup-mobile-resources.mjs
 */
import { copyFile, mkdir } from "node:fs/promises";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MOBILE = join(ROOT, "mobile");
const RESOURCES = join(MOBILE, "resources");
const ICON_SRC = join(ROOT, "public", "icons", "icon-1024.png");

async function main() {
  await mkdir(RESOURCES, { recursive: true });
  await copyFile(ICON_SRC, join(RESOURCES, "icon.png"));
  await copyFile(ICON_SRC, join(RESOURCES, "splash.png"));

  console.log("\n▶ setup-mobile-resources — Capacitor assets\n");
  console.log("  ✓ icon.png + splash.png ← BrandMark 1024");

  execSync(
    "npx capacitor-assets generate --assetPath resources --iconBackgroundColor '#0a1018' --splashBackgroundColor '#1e293b' --splashBackgroundColorDark '#0a1018'",
    { cwd: MOBILE, stdio: "inherit" },
  );

  execSync("npx cap sync", { cwd: MOBILE, stdio: "inherit" });
  console.log("\n✓ Recursos nativos sincronizados (android + ios)\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
