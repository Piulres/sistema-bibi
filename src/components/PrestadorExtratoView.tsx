"use client";

import { useEffect, useState } from "react";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import SectionHeader from "@/components/ui/SectionHeader";
import ExportButtons from "@/components/ExportButtons";

type Extrato = {
  periodLabel: string;
  summary: {
    proceduresCount: number;
    revenueLabel: string;
    billedLabel: string;
    pendingLabel: string;
  };
  lines: {
    id: string;
    performedAtLabel: string;
    patientName: string;
    procedure: string;
    category: string;
    priceLabel: string;
    billed: boolean;
    invoiceStatus: string | null;
    appointmentDateLabel: string;
  }[];
};

export default function PrestadorExtratoView() {
  const [extrato, setExtrato] = useState<Extrato | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/prestador/extrato");
      const data = await res.json();
      if (!active) return;
      if (!res.ok) setError(data.error ?? "Erro ao carregar extrato");
      else setExtrato(data.extrato);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!extrato) return <LoadingState message="Carregando extrato..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--text-muted)]">Período: {extrato.periodLabel}</p>
        <ExportButtons baseUrl="/api/prestador/extrato/export" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Procedimentos"
          value={extrato.summary.proceduresCount}
          info="Procedimentos Pay Per Use registrados por você no período."
        />
        <StatCard
          label="Valor gerado"
          value={extrato.summary.revenueLabel}
          tone="accent"
          info="Soma dos valores cobrados — não é repasse líquido."
        />
        <StatCard
          label="Já faturado"
          value={extrato.summary.billedLabel}
          tone="success"
          info="Procedimentos já incluídos em fatura do paciente."
        />
        <StatCard
          label="Pendente"
          value={extrato.summary.pendingLabel}
          tone="warning"
          info="Procedimentos ainda não faturados ao paciente."
        />
      </div>

      <section>
        <SectionHeader
          title="Linhas do extrato"
          description="Detalhamento por procedimento realizado."
        />
        {extrato.lines.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">Nenhum procedimento no período.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-card)]">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 font-medium">Paciente</th>
                  <th className="px-4 py-2 font-medium">Procedimento</th>
                  <th className="px-4 py-2 font-medium">Faturado</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {extrato.lines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-2 text-[var(--text-muted)]">{line.performedAtLabel}</td>
                    <td className="px-4 py-2 text-[var(--text-secondary)]">{line.patientName}</td>
                    <td className="px-4 py-2">
                      <p className="font-medium text-[var(--text-primary)]">{line.procedure}</p>
                      <p className="text-xs text-[var(--text-muted)]">{line.category}</p>
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge value={line.billed ? "PAGA" : "ABERTA"} map="invoice" />
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-[var(--text-primary)]">
                      {line.priceLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
