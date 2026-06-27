"use client";

import { useEffect, useState } from "react";
import LoadingState from "@/components/ui/LoadingState";

type Report = {
  budgetTotal: number;
  physicalProgress: number;
  financialProgress: number;
  plannedTaskCost: number;
  actualTaskCost: number;
  cashSummary: {
    balancePlanned: number;
    balanceActual: number;
    variance: number;
  };
  tasks: { name: string; plannedTotal: number; actualTotal: number; progressPercent: number }[];
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProjectFinancialPanel({ projectId }: { projectId: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/interno/projects/${projectId}/financial-report`);
      const json = await res.json();
      if (active && res.ok) setReport(json.report as Report);
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) return <LoadingState message="Gerando relatório físico-financeiro…" />;
  if (!report) return <p className="text-sm text-[var(--text-muted)]">Relatório indisponível.</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border p-4 text-sm">
          <p className="text-xs uppercase text-[var(--text-muted)]">Orçamento</p>
          <p className="mt-1 font-semibold">{brl(report.budgetTotal)}</p>
        </div>
        <div className="rounded-xl border p-4 text-sm">
          <p className="text-xs uppercase text-[var(--text-muted)]">Físico</p>
          <p className="mt-1 font-semibold">{report.physicalProgress}%</p>
        </div>
        <div className="rounded-xl border p-4 text-sm">
          <p className="text-xs uppercase text-[var(--text-muted)]">Financeiro</p>
          <p className="mt-1 font-semibold">{report.financialProgress}%</p>
        </div>
        <div className="rounded-xl border p-4 text-sm">
          <p className="text-xs uppercase text-[var(--text-muted)]">Caixa realizado</p>
          <p className="mt-1 font-semibold">{brl(report.cashSummary.balanceActual)}</p>
        </div>
      </div>
      <div className="rounded-xl border p-4">
        <h4 className="font-medium">Cronograma físico-financeiro</h4>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--text-muted)]">
              <th className="pb-2">Tarefa</th>
              <th>Orçado</th>
              <th>Realizado</th>
              <th>% físico</th>
            </tr>
          </thead>
          <tbody>
            {report.tasks.map((t) => (
              <tr key={t.name} className="border-t">
                <td className="py-2">{t.name}</td>
                <td>{brl(t.plannedTotal)}</td>
                <td>{brl(t.actualTotal)}</td>
                <td>{t.progressPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
