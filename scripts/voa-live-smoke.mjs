#!/usr/bin/env node
/**
 * Smoke test ao vivo — integração Voa contra dev server (localhost:3000).
 * Uso: node scripts/voa-live-smoke.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const COOKIE = "/tmp/bibi-voa-smoke-cookies.txt";

function loadEnv() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i);
    const val = t.slice(i + 1).replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

async function req(path, opts = {}) {
  const headers = { ...(opts.headers ?? {}) };
  if (opts.body) headers["Content-Type"] = "application/json";
  const args = [
    "-s",
    "-S",
    "-b",
    COOKIE,
    "-c",
    COOKIE,
    "-w",
    "\n__HTTP__%{http_code}",
    "-X",
    opts.method ?? "GET",
    ...(opts.body ? ["-d", JSON.stringify(opts.body)] : []),
    `${BASE}${path}`,
  ];
  if (headers["Content-Type"]) args.unshift("-H", `Content-Type: ${headers["Content-Type"]}`);
  const out = execSync(`curl ${args.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(" ")}`, {
    encoding: "utf8",
  });
  const idx = out.lastIndexOf("\n__HTTP__");
  const status = Number(out.slice(idx + 9));
  const body = out.slice(0, idx);
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    json = body;
  }
  return { status, json, raw: body };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

loadEnv();

let restoredDataStoreMode = null;

async function ensureDemoDataStore() {
  const loginInterno = await req("/api/auth/login", {
    method: "POST",
    body: {
      email: "faturamento@bibi.health",
      password: "bibi123",
      portal: "interno",
    },
  });
  assert(loginInterno.status === 200, `Login interno falhou: ${loginInterno.status}`);

  const status = await req("/api/interno/data-store");
  if (status.status === 200 && status.json.mode === "operation") {
    restoredDataStoreMode = "operation";
    const switchRes = await req("/api/interno/data-store", {
      method: "POST",
      body: { mode: "demo", confirm: "DEMO" },
    });
    assert(switchRes.status === 200, `Troca para demo falhou: ${switchRes.status} ${JSON.stringify(switchRes.json)}`);
    console.log("✓ Modo demo ativado (estava em operação sem massa)");
  } else if (status.status === 200) {
    console.log("✓ Modo demo já ativo");
  }

  try {
    execSync(`rm -f '${COOKIE}'`);
  } catch {
    /* ignore */
  }
}

async function restoreDataStoreMode() {
  if (!restoredDataStoreMode) return;
  const loginInterno = await req("/api/auth/login", {
    method: "POST",
    body: {
      email: "faturamento@bibi.health",
      password: "bibi123",
      portal: "interno",
    },
  });
  if (loginInterno.status !== 200) return;
  await req("/api/interno/data-store", {
    method: "POST",
    body: { mode: restoredDataStoreMode, confirm: "OPERAR" },
  });
  try {
    execSync(`rm -f '${COOKIE}'`);
  } catch {
    /* ignore */
  }
}

console.log("=== Voa live smoke ===");
console.log("Base:", BASE);
console.log("VOA_ENABLED:", process.env.VOA_ENABLED);
console.log("VOA_ENV:", process.env.VOA_ENV);
console.log("Token configurado:", Boolean(process.env.VOA_INTEGRATION_TOKEN));

// 0. Plugin CDN
try {
const pluginStatus = execSync('curl -s -o /dev/null -w "%{http_code}" https://integration.voa.health/plugin.js', {
  encoding: "utf8",
}).trim();
assert(pluginStatus === "200", `plugin.js inacessível (${pluginStatus})`);
console.log("✓ plugin.js CDN (200)");

// 1. Garantir massa demo (dual-store pode estar em operação vazia)
await ensureDemoDataStore();

// 2. Login prestador
const login = await req("/api/auth/login", {
  method: "POST",
  body: {
    email: "dra.helena@bibi.health",
    password: "bibi123",
    portal: "prestador",
  },
});
assert(login.status === 200, `Login falhou: ${login.status} ${JSON.stringify(login.json)}`);
console.log("✓ Login prestador");

// 3. Agenda → primeiro agendamento (upcoming ou past)
async function pickAppointment() {
  for (const view of ["upcoming", "past", "day"]) {
    const res = await req(`/api/prestador/agenda?view=${view}`);
    assert(res.status === 200, `Agenda (${view}) falhou: ${res.status}`);
    const list = res.json.appointments ?? [];
    if (list.length > 0) return { view, appointments: list };
  }
  return { view: null, appointments: [] };
}

const { view: agendaView, appointments } = await pickAppointment();
assert(appointments.length > 0, "Nenhum agendamento no seed (modo demo)");
const appointmentId = appointments[0].id;
const patientId = appointments[0].patient?.id;
assert(appointmentId && patientId, "Agendamento sem id/paciente");
console.log(`✓ Agenda (${agendaView}) — appointment`, appointmentId.slice(0, 12) + "…");

// 4. Sessão Voa
const voa = await req(`/api/prestador/appointments/${appointmentId}/voa`);
assert(voa.status === 200, `GET voa falhou: ${voa.status} ${JSON.stringify(voa.json)}`);
assert(voa.json.enabled === true, "VOA_ENABLED deveria ser true no servidor");
assert(voa.json.configured === true, "Token Voa não configurado no servidor");
assert(voa.json.token?.startsWith("sk_user_"), "Token homologação ausente na resposta");
assert(voa.json.mount?.options?.enableFillEhr === true, "enableFillEhr deveria ser true");
console.log("✓ GET /voa — enabled, token homologação, mount OK");

// 5. Import PEP (simula ehr.fill)
const doc = `# Anamnese Voa (smoke ${new Date().toISOString()})\n\nQueixa: teste automatizado de integração.`;
const imp = await req(`/api/prestador/appointments/${appointmentId}/voa/import`, {
  method: "POST",
  body: {
    patientId,
    document: doc,
    templateName: "Anamnese padrão",
    templateSlug: "anamnese-padrao",
  },
});
assert(imp.status === 200, `POST import falhou: ${imp.status} ${JSON.stringify(imp.json)}`);
assert(imp.json.record?.id, "Record não criado");
assert(imp.json.record?.recordType === "ANAMNESE", "recordType deveria ser ANAMNESE");
console.log("✓ POST /voa/import — PEP criado", imp.json.record.id.slice(0, 12) + "…");

// 6. Página atendimento (rota protegida + view carregada)
const page = await req(`/prestador/atendimento/${appointmentId}`);
assert(page.status === 200, `Página atendimento falhou: ${page.status}`);
assert(
  typeof page.raw === "string" &&
    (page.raw.includes("AtendimentoView") || page.raw.includes("atendimento")),
  "Página de atendimento não carregou o componente esperado",
);
console.log("✓ Página atendimento acessível (AtendimentoView)");

await restoreDataStoreMode();
if (restoredDataStoreMode) {
  console.log("✓ Modo operação restaurado");
}

console.log("\n=== Todos os checks passaram ===");
} catch (err) {
  await restoreDataStoreMode().catch(() => {});
  throw err;
}
