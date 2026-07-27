#!/usr/bin/env node
/**
 * Gera PNGs estáticos da marca circular (PWA manifest + Netlify CDN).
 * Usa o mesmo layout de icon.tsx via ImageResponse.
 *
 * Uso: npx tsx scripts/generate-brand-icons.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ImageResponse } from "next/og";
import React from "react";
import { OgBrandMark } from "../src/lib/brand/brand-mark-og.tsx";
import { PLATFORM_BRANDING } from "../src/lib/theme/tokens.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "icons");

const SIZES = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-1024.png", size: 1024 },
] as const;

async function renderPng(size: number): Promise<Buffer> {
  const response = new ImageResponse(
    React.createElement(OgBrandMark, {
      input: {
        displayName: PLATFORM_BRANDING.displayName,
        primaryColor: PLATFORM_BRANDING.primaryColor,
        accentColor: PLATFORM_BRANDING.accentColor,
        heroTo: PLATFORM_BRANDING.heroTo,
      },
      size,
    }),
    { width: size, height: size },
  );
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`\n▶ generate-brand-icons — ${PLATFORM_BRANDING.displayName}\n`);

  for (const { name, size } of SIZES) {
    const buffer = await renderPng(size);
    const target = join(OUT_DIR, name);
    await writeFile(target, buffer);
    console.log(`  ✓ ${name} (${size}×${size}, ${buffer.length} bytes)`);
  }

  console.log("\n✓ Ícones PWA gerados em public/icons/\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
