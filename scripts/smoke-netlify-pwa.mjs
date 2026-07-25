#!/usr/bin/env node
/**
 * Smoke pós-build: sobe `next start` e valida rotas críticas da PWA v3.0
 * + assets estáticos que a Netlify precisa servir após o deploy.
 *
 * Uso: node scripts/smoke-netlify-pwa.mjs
 * Não faz deploy.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = process.cwd();

async function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
    s.on("error", reject);
  });
}

async function waitFor(url, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch {
      // still booting
    }
    await sleep(250);
  }
  throw new Error(`Timeout aguardando ${url}`);
}

async function check(base, path, { expectJson, expectCt } = {}) {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (expectCt && !ct.includes(expectCt)) {
    throw new Error(`${path} content-type inesperado: ${ct}`);
  }
  if (expectJson) {
    const body = await res.json();
    if (body.display !== "standalone") {
      throw new Error(`manifest.display=${body.display}, esperado standalone`);
    }
    if (!Array.isArray(body.icons) || body.icons.length < 2) {
      throw new Error("manifest.icons incompleto");
    }
  }
  return ct;
}

const port = await freePort();
const base = `http://127.0.0.1:${port}`;

console.log(`\n▶ smoke-netlify-pwa — next start :${port}\n`);

const child = spawn("npx", ["next", "start", "-p", String(port), "-H", "127.0.0.1"], {
  cwd: ROOT,
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, PORT: String(port), NODE_ENV: "production" },
});

let logs = "";
child.stdout.on("data", (d) => {
  logs += d.toString();
});
child.stderr.on("data", (d) => {
  logs += d.toString();
});

const shutdown = () => {
  if (!child.killed) child.kill("SIGTERM");
};

process.on("exit", shutdown);
process.on("SIGINT", () => {
  shutdown();
  process.exit(130);
});

try {
  await waitFor(`${base}/`);

  await check(base, "/", { expectCt: "text/html" });
  await check(base, "/instalar", { expectCt: "text/html" });
  await check(base, "/manifest.webmanifest", {
    expectCt: "manifest",
    expectJson: true,
  });
  await check(base, "/icons/icon-192.png", { expectCt: "image/png" });
  await check(base, "/icons/icon-512.png", { expectCt: "image/png" });
  await check(base, "/icons/apple-touch-icon.png", { expectCt: "image/png" });
  await check(base, "/interno/login", { expectCt: "text/html" });
  await check(base, "/login", { expectCt: "text/html" });

  const homeHtml = await (await fetch(`${base}/`)).text();
  for (const needle of [
    'rel="manifest"',
    "/manifest.webmanifest",
    'rel="apple-touch-icon"',
    "/icons/apple-touch-icon.png",
    "mobile-web-app-capable",
    "apple-mobile-web-app-title",
  ]) {
    if (!homeHtml.includes(needle)) {
      throw new Error(`HTML da home sem: ${needle}`);
    }
  }

  const cssMatch = homeHtml.match(/\/_next\/static\/[^"']+\.css/);
  if (!cssMatch) throw new Error("Nenhum chunk CSS em /_next/static na home");
  const cssRes = await fetch(`${base}${cssMatch[0]}`);
  if (!cssRes.ok) throw new Error(`CSS ${cssMatch[0]} → HTTP ${cssRes.status}`);

  console.log("✓ smoke-netlify-pwa OK — PWA + estáticos prontos para Netlify");
  console.log(`  CSS: ${cssMatch[0]}`);
  process.exitCode = 0;
} catch (err) {
  console.error("✗ smoke-netlify-pwa falhou:", err.message);
  if (logs.trim()) {
    console.error("\n--- logs next start (tail) ---\n");
    console.error(logs.slice(-2000));
  }
  process.exitCode = 1;
} finally {
  shutdown();
  await sleep(300);
  process.exit(process.exitCode ?? 0);
}
