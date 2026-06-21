"use client";

import { useCallback, useEffect, useState } from "react";
import { columnClassForStatus } from "@/lib/company-crm";

type CompanyCard = {
  id: string;
  name: string;
  cnpj: string;
  status: string;
  statusLabel: string;
  contractActive: boolean;
  beneficiariesCount: number;
  invoicesCount: number;
};

type PipelineData = {
  statuses: { value: string; label: string }[];
  pipeline: Record<string, CompanyCard[]>;
};

export default function CrmPipelineView() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/interno/crm/pipeline");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Erro ao carregar pipeline");
      return;
    }
    setData(json);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/interno/crm/pipeline");
      const json = await res.json();
      if (!active) return;
      if (!res.ok) setError(json.error ?? "Erro ao carregar pipeline");
      else setData(json);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function updateStatus(companyId: string, companyName: string, status: string) {
    setBusy(companyId);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/companies/${companyId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "Erro ao atualizar status");
        return;
      }
      setMsg(`${companyName} → ${json.company.statusLabel}`);
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-slate-500">Carregando pipeline...</p>;

  return (
    <div className="space-y-4">
      {msg && (
        <p className="rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-800">{msg}</p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {data.statuses.map((status) => {
          const cards = data.pipeline[status.value] ?? [];
          return (
            <div
              key={status.value}
              className={`min-w-[17rem] flex-1 rounded-xl border p-3 ${columnClassForStatus(status.value)}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">{status.label}</h3>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {cards.length}
                </span>
              </div>

              <div className="space-y-3">
                {cards.length === 0 && (
                  <p className="rounded-lg bg-white/60 p-3 text-xs text-slate-500">
                    Nenhuma empresa nesta etapa.
                  </p>
                )}
                {cards.map((company) => (
                  <article
                    key={company.id}
                    className="rounded-lg border border-white/80 bg-white p-3 shadow-sm"
                  >
                    <p className="font-medium text-slate-900">{company.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">CNPJ {company.cnpj}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      {company.beneficiariesCount} beneficiário
                      {company.beneficiariesCount === 1 ? "" : "s"} · {company.invoicesCount}{" "}
                      fatura{company.invoicesCount === 1 ? "" : "s"}
                    </p>
                    <label className="mt-3 block text-xs font-medium text-slate-500">
                      Mover para
                      <select
                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800"
                        value={company.status}
                        disabled={busy === company.id}
                        onChange={(event) =>
                          updateStatus(company.id, company.name, event.target.value)
                        }
                      >
                        {data.statuses.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
