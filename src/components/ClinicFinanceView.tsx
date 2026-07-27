"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import ExportButtons from "@/components/ExportButtons";
import { useToast } from "@/components/ui/Toast";
import { useLabels } from "@/hooks/useLabels";
import { LIST_EXPORT_FORMATS } from "@/lib/exports/format";
import { suggestCedigAmount } from "@/lib/clinic-finance/cedig-pricing";
import type {
  CedigPolypectomyTierId,
  CedigPriceTableId,
} from "@/lib/clinic-finance/cedig-pricing";
import { summarizeClinicMonthStrip } from "@/lib/clinic-finance/month-strip";
import { civilDateISO } from "@/lib/timezone";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Inputs em grid: min-w-0 evita overflow horizontal no mobile. */
const fieldClass =
  "mt-1 w-full min-w-0 min-h-10 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)]";

const labelClass = "block min-w-0 text-sm text-[var(--text-primary)]";

const sectionTitleClass =
  "text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]";

type Provider = { id: string; name: string; specialty: string | null };
type Procedure = { id: string; code: string; name: string; basePrice: number };
type PatientOpt = { id: string; name: string; cpf: string };
type Option = { id: string; label: string };

type Launch = {
  id: string;
  performedAt: string;
  patientName: string;
  paymentMethodLabel: string;
  priceTableLabel?: string;
  amountReceived: number;
  biopsies: number;
  polypectomies: number;
  polypectomyTierLabel?: string;
  mucosectomies: number;
  clips: number;
  bridgeStatus?: string | null;
  bridgeNote?: string | null;
  provider: { name: string };
  procedure: { name: string };
};

type Prefill = {
  appointmentId?: string;
  patientId?: string;
  patientName?: string;
  providerId?: string;
  procedureId?: string;
};

type Expense = {
  id: string;
  categoryLabel: string;
  description: string;
  amount: number;
  expenseDate: string;
};

type Kpis = {
  year: number;
  month: number;
  revenue: number;
  totalExpenses: number;
  operatingProfit: number;
  examCount: number;
  labVials: number;
  averageTicket: number;
  profitPerExam: number;
  totalsCounters: {
    biopsies: number;
    polypectomies: number;
    mucosectomies: number;
    clips: number;
  };
  examsByType: { name: string; count: number; revenue: number }[];
  productionByDoctor: { name: string; count: number; revenue: number; biopsies: number }[];
  expensesByCategory: { label: string; amount: number }[];
};

type Tab = "lancamentos" | "despesas" | "indicadores";

function hasClinicalExtras(form: {
  biopsies: string;
  polypectomies: string;
  polypectomyTier: string;
  mucosectomies: string;
  clips: string;
}) {
  return (
    Number(form.biopsies) > 0 ||
    Number(form.polypectomies) > 0 ||
    Boolean(form.polypectomyTier) ||
    Number(form.mucosectomies) > 0 ||
    Number(form.clips) > 0
  );
}

export default function ClinicFinanceView({ prefill }: { prefill?: Prefill }) {
  const { labels } = useLabels();
  const { showToast } = useToast();
  const now = new Date();
  const [tab, setTab] = useState<Tab>("lancamentos");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [bootLoading, setBootLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpisLoading, setKpisLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const metaReadyRef = useRef(false);
  const kpisKeyRef = useRef<string | null>(null);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Option[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Option[]>([]);
  const [priceTables, setPriceTables] = useState<Option[]>([]);
  const [polypectomyTiers, setPolypectomyTiers] = useState<Option[]>([]);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);

  const [form, setForm] = useState({
    appointmentId: prefill?.appointmentId ?? "",
    patientId: prefill?.patientId ?? "",
    patientName: prefill?.patientName ? decodeURIComponent(prefill.patientName) : "",
    providerId: prefill?.providerId ?? "",
    procedureId: prefill?.procedureId ?? "",
    priceTable: "PARTICULAR",
    paymentMethod: "PIX",
    amountReceived: "",
    biopsies: "0",
    polypectomies: "0",
    polypectomyTier: "",
    mucosectomies: "0",
    clips: "0",
    notes: "",
    performedAt: civilDateISO(now),
  });

  const [expenseForm, setExpenseForm] = useState({
    category: "LABORATORIO",
    description: "",
    amount: "",
    expenseDate: civilDateISO(now),
  });

  const selectedProcedure = procedures.find((p) => p.id === form.procedureId);
  const extrasActive = hasClinicalExtras(form);

  const suggestion = useMemo(() => {
    if (!selectedProcedure) return null;
    return suggestCedigAmount({
      procedureCode: selectedProcedure.code,
      priceTable: form.priceTable as CedigPriceTableId,
      biopsies: Number(form.biopsies),
      polypectomies: Number(form.polypectomies),
      polypectomyTier: (form.polypectomyTier || null) as CedigPolypectomyTierId | null,
      mucosectomies: Number(form.mucosectomies),
      clips: Number(form.clips),
    });
  }, [
    selectedProcedure,
    form.priceTable,
    form.biopsies,
    form.polypectomies,
    form.polypectomyTier,
    form.mucosectomies,
    form.clips,
  ]);

  /** KPIs leves a partir das listas já carregadas — evita esperar a aba Indicadores. */
  const stripKpis = useMemo(
    () => summarizeClinicMonthStrip({ launches, expenses }),
    [launches, expenses],
  );

  function applySuggestion() {
    if (!suggestion) return;
    setForm((f) => ({ ...f, amountReceived: String(suggestion.total) }));
  }

  function patchForm(
    patch: Partial<typeof form>,
    opts?: { keepAmount?: boolean },
  ) {
    setForm((f) => {
      const next = { ...f, ...patch };
      if (opts?.keepAmount) return next;
      const proc = procedures.find((p) => p.id === next.procedureId);
      if (!proc) return next;
      const sug = suggestCedigAmount({
        procedureCode: proc.code,
        priceTable: next.priceTable as CedigPriceTableId,
        biopsies: Number(next.biopsies),
        polypectomies: Number(next.polypectomies),
        polypectomyTier: (next.polypectomyTier ||
          null) as CedigPolypectomyTierId | null,
        mucosectomies: Number(next.mucosectomies),
        clips: Number(next.clips),
      });
      if (!sug) return next;
      return { ...next, amountReceived: String(sug.total) };
    });
  }

  async function loadMeta(): Promise<{ ok: true } | { ok: false; error: string }> {
    const metaRes = await fetch("/api/interno/clinic-finance/meta");
    if (metaRes.status === 403) {
      return {
        ok: false,
        error: "Sem permissão para acessar a gestão clínico-financeira.",
      };
    }
    if (!metaRes.ok) {
      return {
        ok: false,
        error: "Não foi possível carregar menus da gestão clínica. Tente novamente.",
      };
    }
    const meta = await metaRes.json();
    setProviders(meta.providers ?? []);
    setProcedures(meta.procedures ?? []);
    setPatients(meta.patients ?? []);
    setPaymentMethods(meta.paymentMethods ?? []);
    setExpenseCategories(meta.expenseCategories ?? []);
    setPriceTables(meta.priceTables ?? []);
    setPolypectomyTiers(meta.polypectomyTiers ?? []);
    setForm((f) => {
      const firstProc = meta.procedures?.[0];
      const nextProcId = f.procedureId || firstProc?.id || "";
      const proc =
        (meta.procedures as Procedure[] | undefined)?.find((p) => p.id === nextProcId) ??
        firstProc;
      const sug = proc
        ? suggestCedigAmount({
            procedureCode: proc.code,
            priceTable: (f.priceTable || "PARTICULAR") as CedigPriceTableId,
          })
        : null;
      return {
        ...f,
        providerId: f.providerId || meta.providers?.[0]?.id || "",
        procedureId: nextProcId,
        amountReceived:
          f.amountReceived || (sug ? String(sug.total) : String(proc?.basePrice ?? "")),
      };
    });
    metaReadyRef.current = true;
    return { ok: true };
  }

  async function loadPeriod(opts?: { soft?: boolean; includeKpis?: boolean }) {
    const soft = opts?.soft ?? false;
    const includeKpis = opts?.includeKpis ?? false;
    if (soft) setRefreshing(true);
    setLoadError(null);
    const q = `year=${year}&month=${month}`;
    const periodKey = `${year}-${month}`;

    try {
      const fetches: Promise<Response>[] = [
        fetch(`/api/interno/clinic-finance/launches?${q}`),
        fetch(`/api/interno/clinic-finance/expenses?${q}`),
      ];
      if (includeKpis) {
        setKpisLoading(true);
        fetches.push(fetch(`/api/interno/clinic-finance/kpis?${q}`));
      }

      const responses = await Promise.all(fetches);
      const [launchesRes, expensesRes, kpisRes] = responses;

      if (launchesRes.status === 403 || expensesRes.status === 403) {
        setLoadError("Sem permissão para acessar a gestão clínico-financeira.");
        return;
      }
      if (!launchesRes.ok && !expensesRes.ok) {
        setLoadError(
          "Não foi possível carregar a gestão clínico-financeira. Tente novamente.",
        );
        return;
      }

      if (launchesRes.ok) {
        const launchesJson = await launchesRes.json();
        setLaunches(launchesJson.launches ?? []);
      }
      if (expensesRes.ok) {
        const expensesJson = await expensesRes.json();
        setExpenses(expensesJson.expenses ?? []);
      }
      if (includeKpis && kpisRes) {
        if (kpisRes.status === 403) {
          setLoadError("Sem permissão para acessar a gestão clínico-financeira.");
          return;
        }
        if (kpisRes.ok) {
          const kpisJson = await kpisRes.json();
          setKpis(kpisJson.kpis ?? null);
          kpisKeyRef.current = periodKey;
        }
      } else if (kpisKeyRef.current !== periodKey) {
        // Mês mudou — invalida KPIs detalhados até a aba Indicadores pedir de novo
        setKpis(null);
        kpisKeyRef.current = null;
      }
    } finally {
      if (soft) setRefreshing(false);
      setKpisLoading(false);
    }
  }

  async function boot() {
    setBootLoading(true);
    setLoadError(null);
    const meta = await loadMeta();
    if (!meta.ok) {
      setLoadError(meta.error);
      setBootLoading(false);
      return;
    }
    await loadPeriod({ soft: false, includeKpis: false });
    setBootLoading(false);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      await boot();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once
  }, []);

  useEffect(() => {
    if (!metaReadyRef.current) return;
    let active = true;
    (async () => {
      await loadPeriod({
        soft: true,
        includeKpis: tab === "indicadores",
      });
      if (!active) return;
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on month/year
  }, [year, month]);

  useEffect(() => {
    if (tab !== "indicadores") return;
    const periodKey = `${year}-${month}`;
    if (kpisKeyRef.current === periodKey && kpis) return;
    let active = true;
    (async () => {
      setKpisLoading(true);
      setLoadError(null);
      try {
        const kpisRes = await fetch(
          `/api/interno/clinic-finance/kpis?year=${year}&month=${month}`,
        );
        if (!active) return;
        if (kpisRes.status === 403) {
          setLoadError("Sem permissão para acessar a gestão clínico-financeira.");
          return;
        }
        if (!kpisRes.ok) {
          setLoadError("Não foi possível carregar os indicadores. Tente novamente.");
          return;
        }
        const kpisJson = await kpisRes.json();
        setKpis(kpisJson.kpis ?? null);
        kpisKeyRef.current = periodKey;
      } finally {
        if (active) setKpisLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lazy KPIs on tab
  }, [tab, year, month]);

  async function submitLaunch(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/interno/clinic-finance/launches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          patientId: form.patientId || undefined,
          appointmentId: form.appointmentId || undefined,
          amountReceived: Number(form.amountReceived),
          biopsies: Number(form.biopsies),
          polypectomies: Number(form.polypectomies),
          polypectomyTier: form.polypectomyTier || null,
          mucosectomies: Number(form.mucosectomies),
          clips: Number(form.clips),
          performedAt: form.performedAt,
        }),
      });
      let json: {
        error?: string;
        launch?: Launch;
        bridge?: { bridgeStatus?: string; bridgeNote?: string | null } | null;
      } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        json = {};
      }
      if (!res.ok) {
        showToast({
          message:
            json.error ??
            (res.status >= 500
              ? "Erro no servidor ao salvar o lançamento. Tente novamente."
              : "Não foi possível salvar o lançamento."),
          tone: "danger",
        });
        return;
      }
      const bridge = json.bridge;
      const bridgeMsg =
        bridge?.bridgeStatus === "SYNCED"
          ? " Agenda, extrato do médico e fatura atualizados."
          : bridge?.bridgeStatus === "PARTIAL"
            ? ` Ponte parcial: ${bridge.bridgeNote ?? "verifique faturamento"}.`
            : bridge?.bridgeStatus === "FAILED"
              ? ` Lançamento ok; ponte falhou: ${bridge.bridgeNote ?? "erro"}.`
              : "";
      showToast({
        message: `Lançamento registrado.${bridgeMsg}`,
        tone: bridge?.bridgeStatus === "FAILED" ? "info" : "success",
      });
      setForm((f) => ({
        ...f,
        appointmentId: "",
        patientId: "",
        patientName: "",
        biopsies: "0",
        polypectomies: "0",
        polypectomyTier: "",
        mucosectomies: "0",
        clips: "0",
        notes: "",
      }));
      // Soft refresh: mantém o formulário visível; meta não é recarregada
      kpisKeyRef.current = null;
      await loadPeriod({ soft: true, includeKpis: tab === "indicadores" });
    } catch {
      showToast({
        message: "Falha de rede ao salvar o lançamento. Verifique a conexão.",
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/interno/clinic-finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...expenseForm,
          amount: Number(expenseForm.amount),
        }),
      });
      let json: { error?: string } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        json = {};
      }
      if (!res.ok) {
        showToast({
          message:
            json.error ??
            (res.status >= 500
              ? "Erro no servidor ao salvar a despesa. Tente novamente."
              : "Não foi possível salvar a despesa."),
          tone: "danger",
        });
        return;
      }
      showToast({ message: "Despesa registrada.", tone: "success" });
      setExpenseForm((f) => ({ ...f, description: "", amount: "" }));
      kpisKeyRef.current = null;
      await loadPeriod({ soft: true, includeKpis: tab === "indicadores" });
    } catch {
      showToast({
        message: "Falha de rede ao salvar a despesa. Verifique a conexão.",
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  if (bootLoading) {
    return <LoadingState message="Carregando gestão clínica…" />;
  }

  if (loadError && providers.length === 0 && launches.length === 0) {
    return (
      <div className="space-y-3">
        <Alert tone="danger">{loadError}</Alert>
        <Button variant="secondary" onClick={() => void boot()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; shortLabel: string; count?: number }[] = [
    {
      id: "lancamentos",
      label: "1. Lançamentos",
      shortLabel: "Lançamentos",
      count: launches.length,
    },
    {
      id: "despesas",
      label: "2. Despesas",
      shortLabel: "Despesas",
      count: expenses.length,
    },
    { id: "indicadores", label: "3. Indicadores", shortLabel: "Indicadores" },
  ];

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6" data-cursor-id="clinic-finance-root">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
          <label className={labelClass}>
            <span className="mb-1 block text-[var(--text-muted)]">Mês</span>
            <select
              className={fieldClass}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className="mb-1 block text-[var(--text-muted)]">Ano</span>
            <input
              type="number"
              className={fieldClass}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>
        </div>
        <p className="hidden min-w-0 text-sm text-[var(--text-secondary)] md:block md:flex-1">
          Menus prontos + valor sugerido pela tabela. Confirme e salve.
        </p>
        <div
          className="w-full min-w-0 sm:ml-auto sm:w-auto"
          data-cursor-id="clinic-finance-export"
        >
          <ExportButtons
            baseUrl="/api/interno/clinic-finance/export"
            query={{ year: String(year), month: String(month) }}
            formats={LIST_EXPORT_FORMATS}
          />
        </div>
      </div>

      {/* Faixa de KPIs do mês — sempre visível, sem esperar aba Indicadores */}
      <div
        className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4"
        data-cursor-id="clinic-finance-kpi-strip"
        aria-busy={refreshing}
      >
        {(
          [
            ["Receita", brl(stripKpis.revenue)],
            ["Exames", String(stripKpis.examCount)],
            ["Despesas", brl(stripKpis.totalExpenses)],
            ["Lucro", brl(stripKpis.operatingProfit)],
          ] as const
        ).map(([label, value]) => (
          <button
            key={label}
            type="button"
            onClick={() => setTab("indicadores")}
            className="min-w-0 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2.5 text-left transition hover:border-[var(--brand-primary)]/40"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {label}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-[var(--text-primary)] sm:text-base">
              {value}
            </p>
          </button>
        ))}
      </div>

      {refreshing && (
        <p className="text-xs text-[var(--text-muted)]" aria-live="polite">
          Atualizando mês…
        </p>
      )}

      {loadError && (
        <Alert tone="danger">
          {loadError}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => void loadPeriod({ soft: true, includeKpis: tab === "indicadores" })}
          >
            Tentar novamente
          </button>
        </Alert>
      )}

      {form.appointmentId ? (
        <p
          className="rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-sm text-[var(--text-secondary)]"
          data-cursor-id="clinic-finance-from-agenda"
        >
          Prefill da agenda — ao salvar, o exame fica REALIZADO e gera uso PPU + fatura.
        </p>
      ) : null}

      <div
        className="grid grid-cols-3 gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-1 sm:flex sm:flex-nowrap sm:gap-2 sm:overflow-x-auto sm:rounded-none sm:border-0 sm:border-b sm:border-[var(--border-default)] sm:bg-transparent sm:p-0 sm:pb-2"
        role="tablist"
        aria-label="Seções da gestão clínica"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-10 min-w-0 flex-1 rounded-lg px-2 py-2 text-center text-sm font-medium transition sm:flex-none sm:px-3 sm:text-left ${
              tab === t.id
                ? "bg-[var(--brand-primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-card)] sm:hover:bg-[var(--surface-muted)]"
            }`}
          >
            <span className="sm:hidden">
              {t.shortLabel}
              {typeof t.count === "number" ? ` (${t.count})` : ""}
            </span>
            <span className="hidden sm:inline">
              {t.label}
              {typeof t.count === "number" ? ` (${t.count})` : ""}
            </span>
          </button>
        ))}
      </div>

      {tab === "lancamentos" && (
        <section className="min-w-0 space-y-5 sm:space-y-6">
          <form
            onSubmit={submitLaunch}
            className="min-w-0 space-y-5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-3 sm:p-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                <span className="sm:hidden">Novo lançamento</span>
                <span className="hidden sm:inline">
                  Novo lançamento (1 {labels.patient.toLowerCase()} = 1 linha) —
                  sincroniza Prestador e Faturamento
                </span>
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)] sm:hidden">
                1 {labels.patient.toLowerCase()} = 1 linha · sincroniza Prestador e
                Faturamento
              </p>
            </div>

            <div className="min-w-0 space-y-3">
              <h3 className={sectionTitleClass}>{labels.patient}</h3>
              <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className={`${labelClass} md:col-span-2 xl:col-span-3`}>
                  {labels.patient} cadastrado(a)
                  <select
                    className={fieldClass}
                    value={form.patientId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const p = patients.find((x) => x.id === id);
                      patchForm(
                        {
                          patientId: id,
                          patientName: p?.name ?? form.patientName,
                        },
                        { keepAmount: true },
                      );
                    }}
                  >
                    <option value="">— Digitar nome abaixo (ou escolher) —</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.cpf}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`${labelClass} md:col-span-1 xl:col-span-2`}>
                  Nome do {labels.patient.toLowerCase()} *
                  <input
                    required
                    className={fieldClass}
                    value={form.patientName}
                    onChange={(e) =>
                      patchForm(
                        { patientName: e.target.value, patientId: "" },
                        { keepAmount: true },
                      )
                    }
                    placeholder="Nome completo"
                  />
                </label>
                <label className={labelClass}>
                  Data
                  <input
                    type="date"
                    className={fieldClass}
                    value={form.performedAt}
                    onChange={(e) =>
                      patchForm({ performedAt: e.target.value }, { keepAmount: true })
                    }
                  />
                </label>
              </div>
            </div>

            <div className="min-w-0 space-y-3 border-t border-[var(--border-default)] pt-4">
              <h3 className={sectionTitleClass}>Exame e pagamento</h3>
              <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className={labelClass}>
                  Médico *
                  <select
                    required
                    className={fieldClass}
                    value={form.providerId}
                    onChange={(e) =>
                      patchForm({ providerId: e.target.value }, { keepAmount: true })
                    }
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Tabela de preço *
                  <select
                    required
                    className={fieldClass}
                    value={form.priceTable}
                    onChange={(e) => patchForm({ priceTable: e.target.value })}
                  >
                    {(priceTables.length
                      ? priceTables
                      : [
                          { id: "PARTICULAR", label: "Particular" },
                          { id: "CENTRALMED", label: "CentralMed" },
                        ]
                    ).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Tipo de exame *
                  <select
                    required
                    className={fieldClass}
                    value={form.procedureId}
                    onChange={(e) => patchForm({ procedureId: e.target.value })}
                  >
                    {procedures.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Forma de pagamento *
                  <select
                    required
                    className={fieldClass}
                    value={form.paymentMethod}
                    onChange={(e) =>
                      patchForm({ paymentMethod: e.target.value }, { keepAmount: true })
                    }
                  >
                    {paymentMethods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Extras clínicos recolhidos — fluxo rápido sem biópsia/pólipo */}
            <details
              className="min-w-0 rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)]/40 open:bg-transparent"
              data-cursor-id="clinic-finance-extras"
            >
              <summary className="cursor-pointer list-none px-3 py-3 text-sm font-medium text-[var(--text-primary)] marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  <span>
                    Extras clínicos
                    <span className="ml-2 font-normal text-[var(--text-muted)]">
                      biópsias, polipectomia, clips
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-[var(--text-muted)]">
                    {extrasActive ? "com valores" : "opcional"}
                  </span>
                </span>
              </summary>
              <div className="min-w-0 space-y-3 border-t border-[var(--border-default)] px-3 pb-3 pt-3">
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <label className={labelClass}>
                    Biópsias (frascos)
                    <span className="ml-1 font-normal text-[var(--text-muted)]">
                      · R$ 150/un
                    </span>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className={fieldClass}
                      value={form.biopsies}
                      onChange={(e) => patchForm({ biopsies: e.target.value })}
                    />
                  </label>
                  <label className={labelClass}>
                    Tipo de polipectomia
                    <select
                      className={fieldClass}
                      value={form.polypectomyTier}
                      onChange={(e) =>
                        patchForm({
                          polypectomyTier: e.target.value,
                          polypectomies:
                            e.target.value && form.polypectomies === "0"
                              ? "1"
                              : form.polypectomies,
                        })
                      }
                    >
                      <option value="">Nenhuma</option>
                      {polypectomyTiers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    Qtd. polipectomias
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className={fieldClass}
                      value={form.polypectomies}
                      onChange={(e) => patchForm({ polypectomies: e.target.value })}
                    />
                  </label>
                  <label className={labelClass}>
                    Mucosectomias
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className={fieldClass}
                      value={form.mucosectomies}
                      onChange={(e) => patchForm({ mucosectomies: e.target.value })}
                    />
                  </label>
                  <label className={labelClass}>
                    Clips hemostáticos
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className={fieldClass}
                      value={form.clips}
                      onChange={(e) => patchForm({ clips: e.target.value })}
                    />
                  </label>
                </div>
              </div>
            </details>

            <div className="min-w-0 space-y-3 border-t border-[var(--border-default)] pt-4">
              <h3 className={sectionTitleClass}>Valor</h3>
              <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className={labelClass}>
                  Valor recebido (R$) *
                  <input
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    className={fieldClass}
                    value={form.amountReceived}
                    onChange={(e) =>
                      patchForm({ amountReceived: e.target.value }, { keepAmount: true })
                    }
                  />
                </label>
                {suggestion && (
                  <div className="min-w-0 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm md:col-span-2 xl:col-span-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0">
                        Sugestão pela tabela:{" "}
                        <strong>{brl(suggestion.total)}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={applySuggestion}
                        className="min-h-10 shrink-0 px-1 text-[var(--brand-primary)] underline"
                      >
                        Usar sugestão
                      </button>
                    </div>
                    <ul className="mt-1 space-y-0.5 text-xs text-[var(--text-muted)]">
                      {suggestion.breakdown.map((b) => (
                        <li key={b.label} className="break-words">
                          {b.label}: {brl(b.amount)}
                        </li>
                      ))}
                    </ul>
                    {(form.priceTable === "BEM_SAUDE" || form.priceTable === "DR_SAUDE") &&
                      selectedProcedure?.code !== "CEDIG-RESP" && (
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          Bem Saúde / Dr Saúde: preço próprio só no teste respiratório;
                          demais itens usam a tabela Particular.
                        </p>
                      )}
                  </div>
                )}
                <label className={`${labelClass} md:col-span-2 xl:col-span-3`}>
                  Observações
                  <input
                    className={fieldClass}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Complexidade, materiais especiais…"
                  />
                </label>
              </div>
            </div>

            <div className="sticky bottom-2 z-10 min-w-0 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-[var(--surface-card)]/80 sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none sm:border-t sm:border-[var(--border-default)] sm:pt-4">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-w-0 text-sm text-[var(--text-secondary)]">
                  Total:{" "}
                  <strong className="tabular-nums text-[var(--text-primary)]">
                    {form.amountReceived
                      ? brl(Number(form.amountReceived) || 0)
                      : "—"}
                  </strong>
                  {suggestion &&
                    Number(form.amountReceived) !== suggestion.total && (
                      <span className="ml-2 text-xs text-[var(--text-muted)]">
                        (sugestão {brl(suggestion.total)})
                      </span>
                    )}
                </p>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving || providers.length === 0 || procedures.length === 0}
                  className="w-full sm:w-auto"
                >
                  {saving ? "Salvando…" : "Registrar lançamento"}
                </Button>
              </div>
              {(providers.length === 0 || procedures.length === 0) && (
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Cadastre médicos (prestadores) e exames do catálogo CEDIG antes de lançar.
                </p>
              )}
            </div>
          </form>

          <SectionHeader
            title={`Lançamentos do mês (${launches.length})`}
            description="Cada linha sincroniza agenda, extrato do médico e fatura quando a ponte fica SYNCED."
          />

          {/* Mobile: cards legíveis */}
          <div className="space-y-3 md:hidden">
            {launches.length === 0 && (
              <p className="rounded-xl border px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                Nenhum lançamento neste mês.
              </p>
            )}
            {launches.map((l) => (
              <article
                key={l.id}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words font-medium text-[var(--text-primary)]">
                      {l.patientName}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {new Date(l.performedAt).toLocaleDateString("pt-BR")} ·{" "}
                      {l.provider.name}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums text-[var(--brand-accent)]">
                    {brl(l.amountReceived)}
                  </p>
                </div>
                <p className="mt-2 break-words text-sm text-[var(--text-secondary)]">
                  {l.procedure.name}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                  <div className="min-w-0">
                    <dt className="inline">Tabela: </dt>
                    <dd className="inline break-words text-[var(--text-secondary)]">
                      {l.priceTableLabel ?? "—"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="inline">Pagamento: </dt>
                    <dd className="inline break-words text-[var(--text-secondary)]">
                      {l.paymentMethodLabel}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="inline">Bio/Pól/Muc/Clip: </dt>
                    <dd className="inline text-[var(--text-secondary)]">
                      {l.biopsies}/{l.polypectomies}/{l.mucosectomies}/{l.clips}
                    </dd>
                  </div>
                  <div className="min-w-0" title={l.bridgeNote ?? undefined}>
                    <dt className="inline">Ponte: </dt>
                    <dd className="inline text-[var(--text-secondary)]">
                      {l.bridgeStatus ?? "—"}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          {/* Desktop: tabela completa */}
          <div className="ds-scroll-x hidden rounded-xl border md:block">
            <table className="min-w-[52rem] w-full text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-xs uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">{labels.patient}</th>
                  <th className="px-3 py-2">Médico</th>
                  <th className="px-3 py-2">Tabela</th>
                  <th className="px-3 py-2">Exame</th>
                  <th className="px-3 py-2">Pagamento</th>
                  <th className="px-3 py-2">Valor</th>
                  <th className="px-3 py-2">Bio/Pól/Muc/Clip</th>
                  <th className="px-3 py-2">Ponte</th>
                </tr>
              </thead>
              <tbody>
                {launches.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="whitespace-nowrap px-3 py-2">
                      {new Date(l.performedAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-3 py-2">{l.patientName}</td>
                    <td className="px-3 py-2">{l.provider.name}</td>
                    <td className="px-3 py-2">{l.priceTableLabel ?? "—"}</td>
                    <td className="px-3 py-2">{l.procedure.name}</td>
                    <td className="px-3 py-2">{l.paymentMethodLabel}</td>
                    <td className="px-3 py-2 tabular-nums">{brl(l.amountReceived)}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {l.biopsies}/{l.polypectomies}/{l.mucosectomies}/{l.clips}
                    </td>
                    <td
                      className="px-3 py-2 text-xs"
                      title={l.bridgeNote ?? undefined}
                    >
                      {l.bridgeStatus ?? "—"}
                    </td>
                  </tr>
                ))}
                {launches.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-6 text-center text-[var(--text-muted)]"
                    >
                      Nenhum lançamento neste mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "despesas" && (
        <section className="min-w-0 space-y-5 sm:space-y-6">
          <form
            onSubmit={submitExpense}
            className="min-w-0 space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-3 sm:p-4"
          >
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Nova despesa do mês
            </p>
            <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className={labelClass}>
                Categoria *
                <select
                  className={fieldClass}
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, category: e.target.value })
                  }
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${labelClass} md:col-span-2 xl:col-span-2`}>
                Descrição *
                <input
                  required
                  className={fieldClass}
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, description: e.target.value })
                  }
                  placeholder="Ex.: Pagamento Dr. Bruno Dias — julho"
                />
              </label>
              <label className={labelClass}>
                Valor (R$) *
                <input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  className={fieldClass}
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                />
              </label>
              <label className={labelClass}>
                Data
                <input
                  type="date"
                  className={fieldClass}
                  value={expenseForm.expenseDate}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, expenseDate: e.target.value })
                  }
                />
              </label>
            </div>
            <div>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? "Salvando…" : "Registrar despesa"}
              </Button>
            </div>
          </form>

          <SectionHeader title={`Despesas do mês (${expenses.length})`} />

          <ul className="divide-y rounded-xl border border-[var(--border-default)]">
            {expenses.map((e) => (
              <li
                key={e.id}
                className="flex min-w-0 flex-col gap-1 px-3 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-2 sm:px-4"
              >
                <span className="min-w-0 break-words">
                  <span className="font-medium">{e.categoryLabel}</span>
                  {" · "}
                  {e.description}
                  <span className="mt-0.5 block text-[var(--text-muted)] sm:ml-2 sm:mt-0 sm:inline">
                    {new Date(e.expenseDate).toLocaleDateString("pt-BR")}
                  </span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">{brl(e.amount)}</span>
              </li>
            ))}
            {expenses.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                Nenhuma despesa neste mês.
              </li>
            )}
          </ul>
        </section>
      )}

      {tab === "indicadores" && (
        <section className="min-w-0 space-y-5 sm:space-y-6">
          {kpisLoading && !kpis && (
            <LoadingState message="Carregando indicadores do mês…" />
          )}
          {kpis && (
            <>
              <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  ["Receita do mês", brl(kpis.revenue)],
                  ["Total de despesas", brl(kpis.totalExpenses)],
                  ["Lucro operacional", brl(kpis.operatingProfit)],
                  ["Ticket médio", brl(kpis.averageTicket)],
                  ["Exames realizados", String(kpis.examCount)],
                  ["Frascos (lab)", String(kpis.labVials)],
                  ["Lucro por exame", brl(kpis.profitPerExam)],
                  [
                    "Bio / Pól / Muc / Clip",
                    `${kpis.totalsCounters.biopsies}/${kpis.totalsCounters.polypectomies}/${kpis.totalsCounters.mucosectomies}/${kpis.totalsCounters.clips}`,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-xl border border-[var(--border-default)] p-3 sm:p-4"
                  >
                    <p className="break-words text-xs uppercase text-[var(--text-muted)]">
                      {label}
                    </p>
                    <p className="mt-1 break-words text-base font-semibold tabular-nums text-[var(--text-primary)] sm:text-lg">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-[var(--border-default)] p-3 sm:p-4">
                  <h3 className="font-medium">Exames por tipo</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {kpis.examsByType.map((row) => (
                      <li
                        key={row.name}
                        className="flex items-start justify-between gap-3"
                      >
                        <span className="min-w-0 break-words">
                          {row.name} · {row.count}x
                        </span>
                        <span className="shrink-0 tabular-nums">{brl(row.revenue)}</span>
                      </li>
                    ))}
                    {kpis.examsByType.length === 0 && (
                      <li className="text-[var(--text-muted)]">Sem dados.</li>
                    )}
                  </ul>
                </div>
                <div className="min-w-0 rounded-xl border border-[var(--border-default)] p-3 sm:p-4">
                  <h3 className="font-medium">Produção por médico</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {kpis.productionByDoctor.map((row) => (
                      <li
                        key={row.name}
                        className="flex items-start justify-between gap-3"
                      >
                        <span className="min-w-0 break-words">
                          {row.name} · {row.count} exames · {row.biopsies} frascos
                        </span>
                        <span className="shrink-0 tabular-nums">{brl(row.revenue)}</span>
                      </li>
                    ))}
                    {kpis.productionByDoctor.length === 0 && (
                      <li className="text-[var(--text-muted)]">Sem dados.</li>
                    )}
                  </ul>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
