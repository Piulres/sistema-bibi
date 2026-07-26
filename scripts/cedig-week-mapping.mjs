/**
 * Popula agenda CEDIG (semana + walk-ins + gestão) para mapeamento operacional.
 * Uso: node scripts/cedig-week-mapping.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const jar = new Map();

function storeCookies(res) {
  const raw = typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  storeCookies(res);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

function isoLocal(y, m, d, h, min = 0) {
  const dt = new Date(y, m - 1, d, h, min, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;
}

function weekDaysFrom(start) {
  // start = Date (Monday preferred). Return Mon–Sat.
  const days = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

const log = [];
function note(msg, extra) {
  const line = extra ? `${msg} ${JSON.stringify(extra)}` : msg;
  console.log(line);
  log.push({ t: new Date().toISOString(), msg, extra });
}

async function main() {
  // 1) Cookie de segmento
  const seg = await fetch(`${BASE}/?tenant=cedig`);
  storeCookies(seg);
  note("segment", { status: seg.status, cookies: [...jar.keys()] });

  // 2) Login secretária
  const login = await api("/api/auth/login", {
    method: "POST",
    body: {
      email: "alana@cedig.demo",
      password: "bibi123",
      portal: "interno",
      tenantSlug: "cedig",
    },
  });
  note("login alana", { status: login.status, ok: !login.data?.error, error: login.data?.error });
  if (login.status !== 200 || login.data?.error) {
    throw new Error(`Login falhou: ${JSON.stringify(login.data)}`);
  }

  // 3) Catálogo agenda
  const agenda = await api("/api/interno/appointments");
  if (agenda.status !== 200) {
    throw new Error(`Agenda GET falhou: ${JSON.stringify(agenda.data)}`);
  }
  const { patients, providers, procedures } = agenda.data;
  note("catalogo", {
    patients: patients?.length,
    providers: providers?.length,
    procedures: procedures?.map((p) => p.code),
  });

  const byCode = Object.fromEntries((procedures || []).map((p) => [p.code, p]));
  const providersSorted = [...(providers || [])].sort((a, b) => a.name.localeCompare(b.name));
  const patientsSorted = [...(patients || [])].sort((a, b) => a.name.localeCompare(b.name));

  if (!providersSorted.length || !patientsSorted.length) {
    throw new Error("Sem pacientes/prestadores CEDIG no seed");
  }

  // Próxima segunda a partir de hoje (se hoje for domingo 26/07 → 27/07)
  const today = new Date();
  const monday = new Date(today);
  const dow = monday.getDay(); // 0=Sun
  const add = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  monday.setDate(monday.getDate() + add);
  monday.setHours(0, 0, 0, 0);
  const days = weekDaysFrom(monday);

  const slots = [8, 9, 10, 11, 14, 15, 16];
  const examRotation = [
    "CEDIG-ENDO",
    "CEDIG-COLO",
    "CEDIG-ENDO-COLO",
    "CEDIG-RESP",
    "CEDIG-MUCO",
  ];

  let createdAppts = 0;
  let failedAppts = 0;
  const createdIds = [];

  for (let di = 0; di < days.length; di++) {
    const day = days[di];
    // 3–4 consultas/dia cobrindo a semana
    const perDay = di % 2 === 0 ? 4 : 3;
    for (let si = 0; si < perDay; si++) {
      const hour = slots[si % slots.length];
      const patient = patientsSorted[(di * 5 + si) % patientsSorted.length];
      const provider = providersSorted[(di + si) % providersSorted.length];
      const code = examRotation[(di + si) % examRotation.length];
      const procedure = byCode[code];
      const scheduledAt = isoLocal(
        day.getFullYear(),
        day.getMonth() + 1,
        day.getDate(),
        hour,
        si % 2 === 0 ? 0 : 30,
      );
      const res = await api("/api/interno/appointments", {
        method: "POST",
        body: {
          patientId: patient.id,
          providerId: provider.id,
          procedureId: procedure?.id,
          scheduledAt,
          reason: `Mapeamento CEDIG — ${code} — semana`,
          status: "AGENDADO",
          modality: "PRESENCIAL",
        },
      });
      if (res.status === 200 || res.status === 201) {
        createdAppts++;
        createdIds.push(res.data?.id || res.data?.appointment?.id);
      } else {
        failedAppts++;
        note("appt fail", { day: scheduledAt, status: res.status, err: res.data?.error });
      }
    }
  }
  note("agenda semana", { createdAppts, failedAppts, weekStart: days[0].toISOString().slice(0, 10) });

  // 4) Walk-ins (hoje + amanhã)
  const walkIns = [
    {
      name: "Carlos Walkin Endo",
      cpf: "52998224725",
      birthDate: "1985-03-12",
      phone: "12999990001",
      hour: 17,
      dayOffset: 0,
      procedureCode: "CEDIG-ENDO",
    },
    {
      name: "Helena Walkin Colo",
      cpf: "39053344705",
      birthDate: "1990-07-21",
      phone: "12999990002",
      hour: 17,
      dayOffset: 1,
      procedureCode: "CEDIG-COLO",
    },
    {
      name: "Roberto Walkin Respiratorio",
      cpf: "15350946056",
      birthDate: "1978-11-03",
      phone: "12999990003",
      hour: 18,
      dayOffset: 0,
      procedureCode: "CEDIG-RESP",
    },
  ];

  let walkOk = 0;
  let walkFail = 0;
  for (let i = 0; i < walkIns.length; i++) {
    const w = walkIns[i];
    const d = new Date(today);
    d.setDate(d.getDate() + w.dayOffset);
    const scheduledAt = isoLocal(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate(),
      w.hour,
      0,
    );
    const provider = providersSorted[i % providersSorted.length];
    const procedure = byCode[w.procedureCode];
    const res = await api("/api/interno/appointments/walk-in", {
      method: "POST",
      body: {
        name: w.name,
        cpf: w.cpf,
        birthDate: w.birthDate,
        phone: w.phone,
        providerId: provider.id,
        procedureId: procedure?.id,
        scheduledAt,
        reason: `Walk-in mapeamento — ${w.procedureCode}`,
      },
    });
    if (res.status === 200 || res.status === 201) {
      walkOk++;
      note("walk-in ok", { name: w.name, scheduledAt });
    } else {
      walkFail++;
      note("walk-in fail", { name: w.name, status: res.status, err: res.data?.error });
    }
  }
  note("walk-ins", { walkOk, walkFail });

  // 5) Meta gestão (médicos/procedimentos)
  const meta = await api("/api/interno/clinic-finance/meta");
  note("gestao meta", { status: meta.status, keys: meta.data && Object.keys(meta.data) });

  const gProviders = meta.data?.providers || providersSorted;
  const gProcedures = meta.data?.procedures || procedures;
  const gByCode = Object.fromEntries((gProcedures || []).map((p) => [p.code, p]));

  const launches = [
    {
      patientName: "Maria Teste Homolog",
      exam: "CEDIG-ENDO",
      table: "PARTICULAR",
      paymentMethod: "PIX",
      biopsies: 1,
      amountReceived: 900,
      providerIdx: 0,
    },
    {
      patientName: "José CentralMed",
      exam: "CEDIG-COLO",
      table: "CENTRALMED",
      paymentMethod: "CONVENIO",
      biopsies: 0,
      amountReceived: 1250,
      providerIdx: 1,
    },
    {
      patientName: "Ana Polipectomia",
      exam: "CEDIG-COLO",
      table: "PARTICULAR",
      paymentMethod: "CARTAO",
      biopsies: 0,
      polypectomies: 1,
      polypectomyTier: "INTERMEDIARIA",
      clips: 1,
      amountReceived: 3200,
      providerIdx: 2,
    },
    {
      patientName: "Pedro Respiratório",
      exam: "CEDIG-RESP",
      table: "BEM_SAUDE",
      paymentMethod: "CONVENIO",
      biopsies: 0,
      amountReceived: 450,
      providerIdx: 3,
    },
  ];

  let launchOk = 0;
  for (const L of launches) {
    const provider = gProviders[L.providerIdx % gProviders.length];
    const procedure = gByCode[L.exam];
    const res = await api("/api/interno/clinic-finance/launches", {
      method: "POST",
      body: {
        performedAt: new Date().toISOString(),
        patientName: L.patientName,
        providerId: provider.id,
        procedureId: procedure?.id,
        paymentMethod: L.paymentMethod,
        priceTable: L.table,
        amountReceived: L.amountReceived,
        biopsies: L.biopsies ?? 0,
        polypectomies: L.polypectomies ?? 0,
        polypectomyTier: L.polypectomyTier ?? null,
        clips: L.clips ?? 0,
        notes: "Mapeamento operacional CEDIG",
        syncOperations: true,
      },
    });
    if (res.status === 201 || res.status === 200) {
      launchOk++;
      note("launch ok", {
        patient: L.patientName,
        amount: L.amountReceived,
        bridge: res.data?.bridgeStatus || res.data?.launch?.bridgeStatus,
      });
    } else {
      note("launch fail", { patient: L.patientName, status: res.status, err: res.data?.error });
    }
  }

  // 6) Despesas
  const expenses = [
    { category: "LABORATORIO", description: "Lab biópsias — mapeamento", amount: 300 },
    { category: "PESSOAL", description: "Pagamento equipe — mapeamento", amount: 500 },
  ];
  let expOk = 0;
  for (const e of expenses) {
    const res = await api("/api/interno/clinic-finance/expenses", {
      method: "POST",
      body: {
        ...e,
        expenseDate: new Date().toISOString().slice(0, 10),
      },
    });
    if (res.status === 201 || res.status === 200) {
      expOk++;
    } else {
      note("expense fail", { status: res.status, err: res.data?.error, e });
    }
  }

  const kpis = await api("/api/interno/clinic-finance/kpis");
  note("kpis", { status: kpis.status, data: kpis.data });

  const summary = {
    weekStart: days[0].toISOString().slice(0, 10),
    weekEnd: days[days.length - 1].toISOString().slice(0, 10),
    createdAppts,
    failedAppts,
    walkOk,
    walkFail,
    launchOk,
    expOk,
    providers: providersSorted.map((p) => p.name),
    procedures: Object.keys(byCode),
  };

  mkdirSync("/opt/cursor/artifacts/cedig-mapeamento", { recursive: true });
  writeFileSync(
    "/opt/cursor/artifacts/cedig-mapeamento/api-seed-log.json",
    JSON.stringify({ summary, log }, null, 2),
  );
  console.log("\n=== RESUMO ===");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
