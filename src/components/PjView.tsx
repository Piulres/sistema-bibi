"use client";

import { useEffect, useState } from "react";

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

  if (error) return <p className="text-red-600">{error}</p>;
  if (!company) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Contrato</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{company.status}</p>
          <p className="text-xs text-slate-400">
            {company.contractActive ? "Operacional" : "Inoperante"} · CNPJ {company.cnpj}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Beneficiários</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {company.beneficiariesCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Consumo total (Pay Per Use)</p>
          <p className="mt-1 text-lg font-semibold text-fuchsia-700">
            {company.totalConsumedLabel}
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Beneficiários</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">CPF</th>
                <th className="px-4 py-2 font-medium">Procedimentos</th>
                <th className="px-4 py-2 text-right font-medium">Consumo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {beneficiaries.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2 text-slate-800">{b.name}</td>
                  <td className="px-4 py-2 text-slate-500">{b.cpf}</td>
                  <td className="px-4 py-2 text-slate-500">{b.usageCount}</td>
                  <td className="px-4 py-2 text-right font-semibold text-slate-900">
                    {b.consumedLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Faturas da empresa</h2>
        {invoices.length === 0 ? (
          <p className="mt-4 rounded-lg bg-white p-4 text-slate-500">
            Nenhuma fatura emitida ainda.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <span className="text-sm text-slate-600">
                  {new Date(inv.createdAt).toLocaleDateString("pt-BR")} ·{" "}
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {inv.status}
                  </span>
                </span>
                <span className="font-semibold text-slate-900">{inv.totalLabel}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
