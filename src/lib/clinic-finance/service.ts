import { getPrisma } from "@/lib/db";
import {
  CLINIC_EXPENSE_CATEGORIES,
  CLINIC_PAYMENT_METHODS,
  clinicExpenseCategoryLabel,
  clinicPaymentMethodLabel,
  type ClinicExpenseCategoryId,
  type ClinicPaymentMethodId,
} from "@/lib/clinic-finance/constants";
import {
  CEDIG_POLYPECTOMY_TIERS,
  CEDIG_PRICE_TABLES,
  cedigPolypectomyTierLabel,
  cedigPriceTableLabel,
  isCedigPolypectomyTierId,
  isCedigPriceTableId,
  suggestCedigAmount,
  type CedigPriceTableId,
} from "@/lib/clinic-finance/cedig-pricing";
import { bridgeExamLaunchToOperations } from "@/lib/clinic-finance/bridge";
import type { TabularExport } from "@/lib/exports/tabular";
import { civilDateISO, zonedDateTimeToUtc } from "@/lib/timezone";

/** Intervalo [início, fim) do mês civil no fuso da app (America/Sao_Paulo). */
function monthRange(year: number, month: number) {
  const start = zonedDateTimeToUtc({ year, month, day: 1, hour: 0, minute: 0, second: 0 });
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = zonedDateTimeToUtc({
    year: nextYear,
    month: nextMonth,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  });
  return { start, end };
}

function parseMonth(year?: number, month?: number) {
  const [civilYear, civilMonth] = civilDateISO().split("-").map(Number);
  const y = year && year > 2000 ? year : civilYear;
  const m = month && month >= 1 && month <= 12 ? month : civilMonth;
  return { year: y, month: m, ...monthRange(y, m) };
}

export async function listClinicProviders(tenantId: string) {
  const prisma = await getPrisma();
  const rows = await prisma.user.findMany({
    where: {
      tenantId,
      role: "PRESTADOR",
      // aliases legados do primeiro seed CEDIG
      NOT: { email: { in: ["bruno@cedig.demo", "luiza@cedig.demo"] } },
    },
    select: { id: true, name: true, specialty: true, email: true },
    orderBy: { name: "asc" },
  });
  // dedupe por nome normalizado (evita Bruno/Luiza duplicados)
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = r.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(({ id, name, specialty }) => ({ id, name, specialty }));
}

export async function listClinicPatients(tenantId: string) {
  const prisma = await getPrisma();
  return prisma.patient.findMany({
    where: { tenantId },
    select: { id: true, name: true, cpf: true },
    orderBy: { name: "asc" },
    take: 200,
  });
}

export async function listClinicExamProcedures(tenantId: string) {
  const prisma = await getPrisma();
  return prisma.procedure.findMany({
    where: {
      tenantId,
      OR: [
        { category: "EXAME" },
        { serviceType: "ENDOSCOPIA" },
        { code: { startsWith: "CEDIG-" } },
      ],
    },
    select: { id: true, code: true, name: true, basePrice: true },
    orderBy: { name: "asc" },
  });
}

export type CreateExamLaunchInput = {
  performedAt?: string;
  patientName: string;
  providerId: string;
  procedureId: string;
  paymentMethod: string;
  priceTable?: string;
  amountReceived: number;
  biopsies?: number;
  polypectomies?: number;
  polypectomyTier?: string | null;
  mucosectomies?: number;
  clips?: number;
  notes?: string;
  patientId?: string;
  /** Agenda de origem — reutiliza appointment (status → REALIZADO). */
  appointmentId?: string;
  /** Default true — gera Appointment + ProcedureUsage + Invoice. */
  syncOperations?: boolean;
  createdById?: string;
};

export async function createExamLaunch(
  tenantId: string,
  input: CreateExamLaunchInput,
) {
  const patientName = input.patientName.trim();
  if (!patientName) return { error: "Informe o nome do paciente." } as const;
  if (!input.providerId) return { error: "Selecione o médico responsável." } as const;
  if (!input.procedureId) return { error: "Selecione o tipo de exame." } as const;

  const paymentOk = CLINIC_PAYMENT_METHODS.some((p) => p.id === input.paymentMethod);
  if (!paymentOk) return { error: "Forma de pagamento inválida." } as const;

  const priceTableRaw = input.priceTable || "PARTICULAR";
  if (!isCedigPriceTableId(priceTableRaw)) {
    return { error: "Tabela de preço inválida." } as const;
  }
  const priceTable: CedigPriceTableId = priceTableRaw;

  const amount = Number(input.amountReceived);
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Valor recebido inválido." } as const;
  }

  const tierRaw = input.polypectomyTier?.trim() || null;
  if (tierRaw && !isCedigPolypectomyTierId(tierRaw)) {
    return { error: "Tipo de polipectomia inválido." } as const;
  }

  const prisma = await getPrisma();
  const [provider, procedure] = await Promise.all([
    prisma.user.findFirst({
      where: { id: input.providerId, tenantId, role: "PRESTADOR" },
    }),
    prisma.procedure.findFirst({
      where: { id: input.procedureId, tenantId },
    }),
  ]);
  if (!provider) return { error: "Médico não encontrado neste tenant." } as const;
  if (!procedure) return { error: "Tipo de exame não encontrado." } as const;

  let patientId = input.patientId?.trim() || null;
  if (patientId) {
    const linked = await prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });
    if (!linked) return { error: "Paciente não encontrado neste tenant." } as const;
  } else {
    // Resolve por nome exato (case-insensitive via equals SQLite) entre cadastrados
    const match = await prisma.patient.findFirst({
      where: { tenantId, name: patientName },
    });
    if (match) patientId = match.id;
  }

  const nonNeg = (n: unknown) => {
    const v = Math.floor(Number(n ?? 0));
    return Number.isFinite(v) && v >= 0 ? v : 0;
  };

  let launch = await prisma.clinicExamLaunch.create({
    data: {
      tenantId,
      performedAt: input.performedAt ? new Date(input.performedAt) : new Date(),
      patientName,
      providerId: provider.id,
      procedureId: procedure.id,
      paymentMethod: input.paymentMethod as ClinicPaymentMethodId,
      priceTable,
      amountReceived: amount,
      biopsies: nonNeg(input.biopsies),
      polypectomies: nonNeg(input.polypectomies),
      polypectomyTier: tierRaw,
      mucosectomies: nonNeg(input.mucosectomies),
      clips: nonNeg(input.clips),
      notes: input.notes?.trim() || null,
      patientId,
      createdById: input.createdById || null,
      bridgeStatus: input.syncOperations === false ? "SKIPPED" : null,
    },
    include: {
      provider: { select: { id: true, name: true } },
      procedure: { select: { id: true, name: true, code: true } },
    },
  });

  let bridge = null;
  if (input.syncOperations !== false) {
    bridge = await bridgeExamLaunchToOperations({
      tenantId,
      launchId: launch.id,
      appointmentId: input.appointmentId,
      createdById: input.createdById,
    });
    launch = await prisma.clinicExamLaunch.findFirstOrThrow({
      where: { id: launch.id },
      include: {
        provider: { select: { id: true, name: true } },
        procedure: { select: { id: true, name: true, code: true } },
      },
    });
  }

  return { launch: serializeLaunch(launch), bridge } as const;
}

function serializeLaunch(launch: {
  id: string;
  performedAt: Date;
  patientName: string;
  paymentMethod: string;
  priceTable: string;
  amountReceived: number;
  biopsies: number;
  polypectomies: number;
  polypectomyTier: string | null;
  mucosectomies: number;
  clips: number;
  notes: string | null;
  bridgeStatus?: string | null;
  bridgeNote?: string | null;
  appointmentId?: string | null;
  usageId?: string | null;
  invoiceId?: string | null;
  provider: { id: string; name: string };
  procedure: { id: string; name: string; code: string };
}) {
  return {
    id: launch.id,
    performedAt: launch.performedAt.toISOString(),
    patientName: launch.patientName,
    paymentMethod: launch.paymentMethod,
    paymentMethodLabel: clinicPaymentMethodLabel(launch.paymentMethod),
    priceTable: launch.priceTable,
    priceTableLabel: cedigPriceTableLabel(launch.priceTable),
    amountReceived: launch.amountReceived,
    biopsies: launch.biopsies,
    polypectomies: launch.polypectomies,
    polypectomyTier: launch.polypectomyTier,
    polypectomyTierLabel: cedigPolypectomyTierLabel(launch.polypectomyTier),
    mucosectomies: launch.mucosectomies,
    clips: launch.clips,
    notes: launch.notes,
    bridgeStatus: launch.bridgeStatus ?? null,
    bridgeNote: launch.bridgeNote ?? null,
    appointmentId: launch.appointmentId ?? null,
    usageId: launch.usageId ?? null,
    invoiceId: launch.invoiceId ?? null,
    provider: launch.provider,
    procedure: launch.procedure,
    labVials: launch.biopsies, // frascos ≈ biópsias na operação CEDIG
  };
}

export async function listExamLaunches(
  tenantId: string,
  year?: number,
  month?: number,
) {
  const prisma = await getPrisma();
  const { start, end } = parseMonth(year, month);
  const rows = await prisma.clinicExamLaunch.findMany({
    where: { tenantId, performedAt: { gte: start, lt: end } },
    include: {
      provider: { select: { id: true, name: true } },
      procedure: { select: { id: true, name: true, code: true } },
    },
    orderBy: { performedAt: "desc" },
  });
  return rows.map(serializeLaunch);
}

export type CreateClinicExpenseInput = {
  category: string;
  description: string;
  amount: number;
  expenseDate?: string;
  createdById?: string;
};

export async function createClinicExpense(
  tenantId: string,
  input: CreateClinicExpenseInput,
) {
  const categoryOk = CLINIC_EXPENSE_CATEGORIES.some((c) => c.id === input.category);
  if (!categoryOk) return { error: "Categoria de despesa inválida." } as const;
  const description = input.description.trim();
  if (!description) return { error: "Informe a descrição da despesa." } as const;
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Valor da despesa inválido." } as const;
  }

  const prisma = await getPrisma();
  const expense = await prisma.clinicExpense.create({
    data: {
      tenantId,
      category: input.category as ClinicExpenseCategoryId,
      description,
      amount,
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
      createdById: input.createdById || null,
    },
  });

  return {
    expense: {
      id: expense.id,
      category: expense.category,
      categoryLabel: clinicExpenseCategoryLabel(expense.category),
      description: expense.description,
      amount: expense.amount,
      expenseDate: expense.expenseDate.toISOString(),
    },
  } as const;
}

export async function listClinicExpenses(
  tenantId: string,
  year?: number,
  month?: number,
) {
  const prisma = await getPrisma();
  const { start, end } = parseMonth(year, month);
  const rows = await prisma.clinicExpense.findMany({
    where: { tenantId, expenseDate: { gte: start, lt: end } },
    orderBy: { expenseDate: "desc" },
  });
  return rows.map((e) => ({
    id: e.id,
    category: e.category,
    categoryLabel: clinicExpenseCategoryLabel(e.category),
    description: e.description,
    amount: e.amount,
    expenseDate: e.expenseDate.toISOString(),
  }));
}

export async function getClinicFinanceKpis(
  tenantId: string,
  year?: number,
  month?: number,
) {
  const prisma = await getPrisma();
  const { year: y, month: m, start, end } = parseMonth(year, month);
  const [launches, expenses] = await Promise.all([
    prisma.clinicExamLaunch.findMany({
      where: { tenantId, performedAt: { gte: start, lt: end } },
      include: {
        provider: { select: { id: true, name: true } },
        procedure: { select: { id: true, name: true } },
      },
    }),
    prisma.clinicExpense.findMany({
      where: { tenantId, expenseDate: { gte: start, lt: end } },
    }),
  ]);

  const revenue = launches.reduce((s, l) => s + l.amountReceived, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const operatingProfit = revenue - totalExpenses;
  const examCount = launches.length;
  const labVials = launches.reduce((s, l) => s + l.biopsies, 0);
  const averageTicket = examCount > 0 ? revenue / examCount : 0;
  const profitPerExam = examCount > 0 ? operatingProfit / examCount : 0;

  const examsByTypeMap = new Map<string, { name: string; count: number; revenue: number }>();
  for (const l of launches) {
    const key = l.procedureId;
    const cur = examsByTypeMap.get(key) ?? {
      name: l.procedure.name,
      count: 0,
      revenue: 0,
    };
    cur.count += 1;
    cur.revenue += l.amountReceived;
    examsByTypeMap.set(key, cur);
  }

  const productionByDoctorMap = new Map<
    string,
    { name: string; count: number; revenue: number; biopsies: number }
  >();
  for (const l of launches) {
    const key = l.providerId;
    const cur = productionByDoctorMap.get(key) ?? {
      name: l.provider.name,
      count: 0,
      revenue: 0,
      biopsies: 0,
    };
    cur.count += 1;
    cur.revenue += l.amountReceived;
    cur.biopsies += l.biopsies;
    productionByDoctorMap.set(key, cur);
  }

  const expensesByCategoryMap = new Map<string, { label: string; amount: number }>();
  for (const e of expenses) {
    const cur = expensesByCategoryMap.get(e.category) ?? {
      label: clinicExpenseCategoryLabel(e.category),
      amount: 0,
    };
    cur.amount += e.amount;
    expensesByCategoryMap.set(e.category, cur);
  }

  return {
    year: y,
    month: m,
    revenue,
    totalExpenses,
    operatingProfit,
    examCount,
    labVials,
    averageTicket,
    profitPerExam,
    totalsCounters: {
      biopsies: launches.reduce((s, l) => s + l.biopsies, 0),
      polypectomies: launches.reduce((s, l) => s + l.polypectomies, 0),
      mucosectomies: launches.reduce((s, l) => s + l.mucosectomies, 0),
      clips: launches.reduce((s, l) => s + l.clips, 0),
    },
    examsByType: [...examsByTypeMap.entries()]
      .map(([procedureId, v]) => ({ procedureId, ...v }))
      .sort((a, b) => b.count - a.count),
    productionByDoctor: [...productionByDoctorMap.entries()]
      .map(([providerId, v]) => ({ providerId, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
    expensesByCategory: [...expensesByCategoryMap.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.amount - a.amount),
  };
}

export async function getClinicFinanceMeta(tenantId: string) {
  const [providers, procedures, patients] = await Promise.all([
    listClinicProviders(tenantId),
    listClinicExamProcedures(tenantId),
    listClinicPatients(tenantId),
  ]);
  return {
    providers,
    procedures,
    patients,
    paymentMethods: CLINIC_PAYMENT_METHODS,
    expenseCategories: CLINIC_EXPENSE_CATEGORIES,
    priceTables: CEDIG_PRICE_TABLES,
    polypectomyTiers: CEDIG_POLYPECTOMY_TIERS,
  };
}

/** Sugestão de valor a partir das tabelas CEDIG (para a secretária). */
export function previewCedigAmount(input: {
  procedureCode: string;
  priceTable: string;
  biopsies?: number;
  polypectomies?: number;
  polypectomyTier?: string | null;
  mucosectomies?: number;
  clips?: number;
}) {
  if (!isCedigPriceTableId(input.priceTable)) return null;
  const tier =
    input.polypectomyTier && isCedigPolypectomyTierId(input.polypectomyTier)
      ? input.polypectomyTier
      : null;
  return suggestCedigAmount({
    procedureCode: input.procedureCode,
    priceTable: input.priceTable,
    biopsies: input.biopsies,
    polypectomies: input.polypectomies,
    polypectomyTier: tier,
    mucosectomies: input.mucosectomies,
    clips: input.clips,
  });
}

/** Export mensal (planilha) — lançamentos + despesas + KPIs. */
export async function buildClinicFinanceMonthExport(
  tenantId: string,
  year?: number,
  month?: number,
): Promise<TabularExport> {
  const { year: y, month: m } = parseMonth(year, month);
  const [launches, expenses, kpis] = await Promise.all([
    listExamLaunches(tenantId, y, m),
    listClinicExpenses(tenantId, y, m),
    getClinicFinanceKpis(tenantId, y, m),
  ]);

  const money = (n: number) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rows: Record<string, string | number | null>[] = [
    {
      tipo: "KPI",
      data: `${String(m).padStart(2, "0")}/${y}`,
      paciente: "—",
      medico: "—",
      exame: "Receita / Despesas / Lucro",
      tabela: "—",
      pagamento: "—",
      valor: money(kpis.revenue),
      biópsias: kpis.totalsCounters.biopsies,
      polipectomias: kpis.totalsCounters.polypectomies,
      mucosectomias: kpis.totalsCounters.mucosectomies,
      clips: kpis.totalsCounters.clips,
      ponte: "—",
      observacoes: `Despesas ${money(kpis.totalExpenses)} · Lucro ${money(kpis.operatingProfit)} · Exames ${kpis.examCount}`,
    },
    ...launches.map((l) => ({
      tipo: "LANCAMENTO",
      data: l.performedAt.slice(0, 10),
      paciente: l.patientName,
      medico: l.provider.name,
      exame: l.procedure.name,
      tabela: l.priceTableLabel,
      pagamento: l.paymentMethodLabel,
      valor: money(l.amountReceived),
      biópsias: l.biopsies,
      polipectomias: l.polypectomies,
      mucosectomias: l.mucosectomies,
      clips: l.clips,
      ponte: l.bridgeStatus ?? "",
      observacoes: l.notes ?? l.bridgeNote ?? "",
    })),
    ...expenses.map((e) => ({
      tipo: "DESPESA",
      data: e.expenseDate.slice(0, 10),
      paciente: "—",
      medico: "—",
      exame: e.categoryLabel,
      tabela: "—",
      pagamento: "—",
      valor: money(e.amount),
      biópsias: 0,
      polipectomias: 0,
      mucosectomias: 0,
      clips: 0,
      ponte: "—",
      observacoes: e.description,
    })),
  ];

  return {
    title: `Gestão clínica ${String(m).padStart(2, "0")}/${y}`,
    subtitle: "Lançamentos, despesas e indicadores — CEDIG / ServiceOS",
    columns: [
      { key: "tipo", header: "Tipo" },
      { key: "data", header: "Data" },
      { key: "paciente", header: "Paciente" },
      { key: "medico", header: "Médico" },
      { key: "exame", header: "Exame / categoria" },
      { key: "tabela", header: "Tabela" },
      { key: "pagamento", header: "Pagamento" },
      { key: "valor", header: "Valor (R$)" },
      { key: "biópsias", header: "Biópsias" },
      { key: "polipectomias", header: "Polipectomias" },
      { key: "mucosectomias", header: "Mucosectomias" },
      { key: "clips", header: "Clips" },
      { key: "ponte", header: "Ponte PPU" },
      { key: "observacoes", header: "Observações" },
    ],
    rows,
  };
}
