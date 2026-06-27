"use client";

import { useEffect, useState } from "react";
import LoadingState from "@/components/ui/LoadingState";
import { INDIRECT_CATEGORIES } from "@/lib/project/construction-modules";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ConstructionFinanceView() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<{
    totalPlannedIncome: number;
    totalActualIncome: number;
    totalPlannedExpense: number;
    totalActualExpense: number;
    cashFlowProjection: number;
    indirectPlanned: number;
    indirectActual: number;
    projects: { projectCode: string; projectName: string; cashSummary: { balanceActual: number } }[];
  } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/interno/construction/finance");
      const json = await res.json();
      if (active && res.ok) setReport(json.report);
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingState message="Carregando financeiro da empresa…" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-xs uppercase text-[var(--text-muted)]">Receita orçada</p>
          <p className="mt-1 text-lg font-semibold">{brl(report?.totalPlannedIncome ?? 0)}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs uppercase text-[var(--text-muted)]">Despesa orçada</p>
          <p className="mt-1 text-lg font-semibold">{brl(report?.totalPlannedExpense ?? 0)}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs uppercase text-[var(--text-muted)]">Projeção fluxo de caixa</p>
          <p className="mt-1 text-lg font-semibold">{brl(report?.cashFlowProjection ?? 0)}</p>
        </div>
      </div>
      <section className="rounded-xl border p-4">
        <h3 className="font-medium">Indiretas da empresa</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Orçado {brl(report?.indirectPlanned ?? 0)} · Realizado {brl(report?.indirectActual ?? 0)}
        </p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Categorias: {INDIRECT_CATEGORIES.map((c) => c.label).join(", ")}
        </p>
      </section>
      <section className="rounded-xl border p-4">
        <h3 className="font-medium">Caixa por obra</h3>
        <ul className="mt-3 divide-y text-sm">
          {report?.projects.map((p) => (
            <li key={p.projectCode} className="flex justify-between py-2">
              <span>{p.projectCode} — {p.projectName}</span>
              <span>{brl(p.cashSummary.balanceActual)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
