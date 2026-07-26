#!/usr/bin/env node
/**
 * Republica prisma/operation.db (ou path informado) no Netlify Blobs
 * com metadata.updatedAt — obrigatório para as Lambdas reidratarem.
 *
 * Uso:
 *   node scripts/publish-operation-blob.mjs /tmp/operation.db
 *
 * Requer NETLIFY_AUTH_TOKEN + NETLIFY_SITE_ID (ou siteID no .netlify/state.json).
 */
import { existsSync, readFileSync } from "node:fs";
import { getStore } from "@netlify/blobs";

const dbPath = process.argv[2];
if (!dbPath || !existsSync(dbPath)) {
  console.error("Uso: node scripts/publish-operation-blob.mjs <operation.db>");
  process.exit(1);
}

const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN;
let siteID = process.env.NETLIFY_SITE_ID;

if (!siteID && existsSync(".netlify/state.json")) {
  try {
    const state = JSON.parse(readFileSync(".netlify/state.json", "utf8"));
    siteID = state.siteId || state.siteID;
  } catch {
    /* ignore */
  }
}

if (!token || !siteID) {
  console.error("Faltam NETLIFY_AUTH_TOKEN e/ou NETLIFY_SITE_ID");
  process.exit(1);
}

const buffer = readFileSync(dbPath);
const arrayBuffer = new ArrayBuffer(buffer.length);
new Uint8Array(arrayBuffer).set(buffer);
const updatedAt = new Date().toISOString();

const store = getStore({
  name: "bibi-databases",
  siteID,
  token,
  consistency: "strong",
});

await store.set("operation.db", arrayBuffer, {
  metadata: { updatedAt },
});

console.log(`✓ Blob bibi-databases/operation.db publicado · updatedAt=${updatedAt} · bytes=${buffer.length}`);
