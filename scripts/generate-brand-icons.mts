#!/usr/bin/env node
/**
 * Gera PNGs estáticos da marca circular (PWA manifest + Netlify CDN).
 * Usa gradiente laranja PWA + variante maskable para iOS/Android.
 *
 * Uso: npx tsx scripts/generate-brand-icons.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ImageResponse } from "next/og";
import React from "react";
import { OgBrandMark } from "../src/lib/brand/brand-mark-og.tsx";
import { brandMarkPwaInput } from "../src/lib/brand/brand-mark.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "icons");

const SIZES = [
  { name: "apple-touch-icon.png", size: 180, inset: 0 },
  { name: "icon-192.png", size: 192, inset: 0 },
  { name: "icon-512.png", size: 512, inset: 0 },
  { name: "icon-512-maskable.png", size: 512, inset: 0.12 },
  { name: "icon-1024.png", size: 1024, inset: 0 },
] as const;

async function renderPng(size: number, inset = 0): Promise<Buffer> {
  const response = new ImageResponse(
    React.createElement(OgBrandMark, {
      input: brandMarkPwaInput(),
      size,
      insetRatio: inset,
    }),
    { width: size, height: size },
  );
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const input = brandMarkPwaInput();
  console.log(`\n▶ generate-brand-icons — ${input.markText ?? input.displayName} (PWA laranja)\n`);

  for (const { name, size, inset } of SIZES) {
    const buffer = await renderPng(size, inset);
    const target = join(OUT_DIR, name);
    await writeFile(target, buffer);
    console.log(`  ✓ ${name} (${size}×${size}, ${buffer.length} bytes${inset ? `, inset ${Math.round(inset * 100)}%` : ""})`);
  }

  console.log("\n✓ Ícones PWA gerados em public/icons/\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
