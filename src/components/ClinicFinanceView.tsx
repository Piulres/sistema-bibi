"use client";

import { useEffect, useState } from "react";
import LoadingState from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Provider = { id: string; name: string; specialty: string | null };
type Procedure = { id: string; code: string; name: string; basePrice: number };
type Option = { id: string; label: string };

type Launch = {
  id: string;
  performedAt: string;
  patientName: string;
  paymentMethodLabel: string;
  amountReceived: number;
  biopsies: number;
  polypectomies: number;
  mucosectomies: number;
  clips: number;
  provider: { name: string };
  procedure: { name: string };
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

export default function ClinicFinanceView() {
  const { showToast } = useToast();
  const now = new Date();
  const [tab, setTab] = useState<Tab>("lancamentos");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Option[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Option[]>([]);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);

  const [form, setForm] = useState({
    patientName: "",
    providerId: "",
    procedureId: "",
    paymentMethod: "PIX",
    amountReceived: "",
    biopsies: "0",
    polypectomies: "0",
    mucosectomies: "0",
    clips: "0",
    notes: "",
    performedAt: now.toISOString().slice(0, 10),
  });

  const [expenseForm, setExpenseForm] = useState({
    category: "LABORATORIO",
    description: "",
    amount: "",
    expenseDate: now.toISOString().slice(0, 10),
  });

  async function loadAll() {
    setLoading(true);
    const q = `year=${year}&month=${month}`;
    const [metaRes, launchesRes, expensesRes, kpisRes] = await Promise.all([
      fetch("/api/interno/clinic-finance/meta"),
      fetch(`/api/interno/clinic-finance/launches?${q}`),
      fetch(`/api/interno/clinic-finance/expenses?${q}`),
      fetch(`/api/interno/clinic-finance/kpis?${q}`),
    ]);
    const meta = await metaRes.json();
    const launchesJson = await launchesRes.json();
    const expensesJson = await expensesRes.json();
    const kpisJson = await kpisRes.json();

    if (metaRes.ok) {
      setProviders(meta.providers ?? []);
      setProcedures(meta.procedures ?? []);
      setPaymentMethods(meta.paymentMethods ?? []);
      setExpenseCategories(meta.expenseCategories ?? []);
      setForm((f) => ({
        ...f,
        providerId: f.providerId || meta.providers?.[0]?.id || "",
        procedureId: f.procedureId || meta.procedures?.[0]?.id || "",
        amountReceived:
          f.amountReceived ||
          (meta.procedures?.[0]?.basePrice != null
            ? String(meta.procedures[0].basePrice)
            : ""),
      }));
    }
    if (launchesRes.ok) setLaunches(launchesJson.launches ?? []);
    if (expensesRes.ok) setExpenses(expensesJson.expenses ?? []);
    if (kpisRes.ok) setKpis(kpisJson.kpis ?? null);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      await loadAll();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on month/year
  }, [year, month]);

  async function submitLaunch(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/interno/clinic-finance/launches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amountReceived: Number(form.amountReceived),
        biopsies: Number(form.biopsies),
        polypectomies: Number(form.polypectomies),
        mucosectomies: Number(form.mucosectomies),
        clips: Number(form.clips),
        performedAt: form.performedAt,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      showToast({
        message: json.error ?? "Não foi possível salvar o lançamento.",
        tone: "danger",
      });
      return;
    }
    showToast({ message: "Lançamento registrado.", tone: "success" });
    setForm((f) => ({
      ...f,
      patientName: "",
      biopsies: "0",
      polypectomies: "0",
      mucosectomies: "0",
      clips: "0",
      notes: "",
    }));
    await loadAll();
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/interno/clinic-finance/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...expenseForm,
        amount: Number(expenseForm.amount),
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      showToast({
        message: json.error ?? "Não foi possível salvar a despesa.",
        tone: "danger",
      });
      return;
    }
    showToast({ message: "Despesa registrada.", tone: "success" });
    setExpenseForm((f) => ({ ...f, description: "", amount: "" }));
    await loadAll();
  }

  if (loading) {
    return <LoadingState message="Carregando gestão clínica…" />;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "lancamentos", label: "1. Lançamentos" },
    { id: "despesas", label: "2. Despesas" },
    { id: "indicadores", label: "3. Indicadores" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">Mês</span>
          <select
            className="rounded-lg border px-3 py-2"
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
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">Ano</span>
          <input
            type="number"
            className="w-24 rounded-lg border px-3 py-2"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </label>
        <p className="text-sm text-[var(--text-secondary)]">
          A secretária só lança dados. Os indicadores calculam sozinhos.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[var(--border-default)] pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-[var(--brand-primary)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "lancamentos" && (
        <section className="space-y-6">
          <form
            onSubmit={submitLaunch}
            className="grid gap-3 rounded-xl border border-[var(--border-default)] p-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <p className="sm:col-span-2 lg:col-span-3 text-sm font-medium text-[var(--text-primary)]">
              Novo lançamento (1 paciente = 1 linha)
            </p>
            <label className="text-sm sm:col-span-2">
              Paciente *
              <input
                required
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.patientName}
                onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                placeholder="Nome completo"
              />
            </label>
            <label className="text-sm">
              Data
              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.performedAt}
                onChange={(e) => setForm({ ...form, performedAt: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Médico *
              <select
                required
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.providerId}
                onChange={(e) => setForm({ ...form, providerId: e.target.value })}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Tipo de exame *
              <select
                required
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.procedureId}
                onChange={(e) => {
                  const proc = procedures.find((p) => p.id === e.target.value);
                  setForm({
                    ...form,
                    procedureId: e.target.value,
                    amountReceived: proc ? String(proc.basePrice) : form.amountReceived,
                  });
                }}
              >
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Forma de pagamento *
              <select
                required
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                {paymentMethods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Valor recebido (R$) *
              <input
                required
                type="number"
                min={0}
                step="0.01"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.amountReceived}
                onChange={(e) => setForm({ ...form, amountReceived: e.target.value })}
              />
            </label>
            {(
              [
                ["biopsies", "Biópsias (frascos)"],
                ["polypectomies", "Polipectomias"],
                ["mucosectomies", "Mucosectomias"],
                ["clips", "Clips"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-sm">
                {label}
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <label className="text-sm sm:col-span-2 lg:col-span-3">
              Observações
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Opcional"
              />
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={saving || providers.length === 0 || procedures.length === 0}
                className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Salvando…" : "Registrar lançamento"}
              </button>
              {(providers.length === 0 || procedures.length === 0) && (
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Cadastre médicos (prestadores) e exames do catálogo CEDIG antes de lançar.
                </p>
              )}
            </div>
          </form>

          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-xs uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Paciente</th>
                  <th className="px-3 py-2">Médico</th>
                  <th className="px-3 py-2">Exame</th>
                  <th className="px-3 py-2">Pagamento</th>
                  <th className="px-3 py-2">Valor</th>
                  <th className="px-3 py-2">Bio/Pól/Muc/Clip</th>
                </tr>
              </thead>
              <tbody>
                {launches.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(l.performedAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-3 py-2">{l.patientName}</td>
                    <td className="px-3 py-2">{l.provider.name}</td>
                    <td className="px-3 py-2">{l.procedure.name}</td>
                    <td className="px-3 py-2">{l.paymentMethodLabel}</td>
                    <td className="px-3 py-2">{brl(l.amountReceived)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {l.biopsies}/{l.polypectomies}/{l.mucosectomies}/{l.clips}
                    </td>
                  </tr>
                ))}
                {launches.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-[var(--text-muted)]">
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
        <section className="space-y-6">
          <form
            onSubmit={submitExpense}
            className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <p className="sm:col-span-2 lg:col-span-4 text-sm font-medium">
              Nova despesa do mês
            </p>
            <label className="text-sm">
              Categoria *
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
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
            <label className="text-sm sm:col-span-2">
              Descrição *
              <input
                required
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, description: e.target.value })
                }
                placeholder="Ex.: Pagamento Bruno — julho"
              />
            </label>
            <label className="text-sm">
              Valor (R$) *
              <input
                required
                type="number"
                min={0}
                step="0.01"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
              />
            </label>
            <label className="text-sm">
              Data
              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={expenseForm.expenseDate}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, expenseDate: e.target.value })
                }
              />
            </label>
            <div className="lg:col-span-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Salvando…" : "Registrar despesa"}
              </button>
            </div>
          </form>

          <ul className="divide-y rounded-xl border">
            {expenses.map((e) => (
              <li key={e.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{e.categoryLabel}</span>
                  {" · "}
                  {e.description}
                  <span className="ml-2 text-[var(--text-muted)]">
                    {new Date(e.expenseDate).toLocaleDateString("pt-BR")}
                  </span>
                </span>
                <span className="font-medium">{brl(e.amount)}</span>
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

      {tab === "indicadores" && kpis && (
        <section className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <div key={label} className="rounded-xl border p-4">
                <p className="text-xs uppercase text-[var(--text-muted)]">{label}</p>
                <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border p-4">
              <h3 className="font-medium">Exames por tipo</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {kpis.examsByType.map((row) => (
                  <li key={row.name} className="flex justify-between gap-2">
                    <span>
                      {row.name} · {row.count}x
                    </span>
                    <span>{brl(row.revenue)}</span>
                  </li>
                ))}
                {kpis.examsByType.length === 0 && (
                  <li className="text-[var(--text-muted)]">Sem dados.</li>
                )}
              </ul>
            </div>
            <div className="rounded-xl border p-4">
              <h3 className="font-medium">Produção por médico</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {kpis.productionByDoctor.map((row) => (
                  <li key={row.name} className="flex justify-between gap-2">
                    <span>
                      {row.name} · {row.count} exames · {row.biopsies} frascos
                    </span>
                    <span>{brl(row.revenue)}</span>
                  </li>
                ))}
                {kpis.productionByDoctor.length === 0 && (
                  <li className="text-[var(--text-muted)]">Sem dados.</li>
                )}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
