"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";

type Company = {
  name: string;
  cnpj: string;
  status: string;
  contractActive: boolean;
  beneficiariesCount: number;
  totalConsumedLabel: string;
};
type Beneficiary = {
  id: string;
  name: string;
  cpf: string;
  usageCount: number;
  consumedLabel: string;
};
type Invoice = { id: string; totalLabel: string; status: string; createdAt: string };

export default function PjView() {
  const [company, setCompany] = useState<Company | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pj/overview")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setCompany(d.company);
          setBeneficiaries(d.beneficiaries);
          setInvoices(d.invoices);
        }
      })
      .catch(() => setError("Falha ao carregar dados da empresa"));
  }, []);

  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!company) return <LoadingState message="Carregando dados da empresa..." />;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-[var(--text-muted)]">Contrato</p>
          <div className="mt-2">
            <StatusBadge value={company.status} map="company" />
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {company.contractActive ? "Operacional" : "Inoperante"} · CNPJ {company.cnpj}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--text-muted)]">Beneficiários</p>
          <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
            {company.beneficiariesCount}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--text-muted)]">Consumo total (Pay Per Use)</p>
          <p className="mt-1 text-lg font-semibold text-[var(--portal-accent)]">
            {company.totalConsumedLabel}
          </p>
        </Card>
      </div>

      <section>
        <SectionHeader title="Beneficiários" />
        <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-card)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">CPF</th>
                <th className="px-4 py-2 font-medium">Procedimentos</th>
                <th className="px-4 py-2 text-right font-medium">Consumo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {beneficiaries.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2 text-[var(--text-secondary)]">{b.name}</td>
                  <td className="px-4 py-2 text-[var(--text-muted)]">{b.cpf}</td>
                  <td className="px-4 py-2 text-[var(--text-muted)]">{b.usageCount}</td>
                  <td className="px-4 py-2 text-right font-semibold text-[var(--text-primary)]">
                    {b.consumedLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionHeader title="Faturas da empresa" />
        {invoices.length === 0 ? (
          <EmptyState message="Nenhuma fatura emitida ainda." />
        ) : (
          <ul className="mt-4 space-y-2">
            {invoices.map((inv) => (
              <Card key={inv.id} padding="sm" className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">
                  {new Date(inv.createdAt).toLocaleDateString("pt-BR")} ·{" "}
                  <StatusBadge value={inv.status} map="invoice" />
                </span>
                <span className="font-semibold text-[var(--text-primary)]">{inv.totalLabel}</span>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
