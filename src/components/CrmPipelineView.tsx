"use client";

import { useCallback } from "react";
import { columnClassForStatus } from "@/lib/company-crm";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";

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
  const { isBusy, run, showToast } = useAsyncAction();

  const loadPipeline = useCallback(
    () =>
      fetchJson<PipelineData>("/api/interno/crm/pipeline", undefined, "Erro ao carregar pipeline"),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(loadPipeline, [], {
    forbiddenMessage: "Sem permissão para acessar o pipeline CRM",
  });

  async function updateStatus(companyId: string, companyName: string, status: string) {
    await run(
      companyId,
      () =>
        fetch(`/api/interno/companies/${companyId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }),
      {
        silentSuccess: true,
        errorMessage: "Erro ao atualizar status",
        onSuccess: async (body) => {
          const company = body.company as { statusLabel?: string } | undefined;
          showToast({
            message: `${companyName} → ${company?.statusLabel ?? status}`,
            tone: "info",
          });
          await reload();
        },
      },
    );
  }

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando pipeline..."
      onRetry={() => void reload()}
    >
      {data && (
        <div className="space-y-4">
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
                            disabled={isBusy(company.id)}
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
      )}
    </ViewStateBoundary>
  );
}
