"use client";

import { useCallback, useMemo, useState } from "react";
import { columnClassForStatus } from "@/lib/company-crm";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import { useRovingTablistKeyDown } from "@/components/ui/RovingTablist";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";
import { cn } from "@/lib/utils/cn";

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

function CompanyPipelineCard({
  company,
  statuses,
  busy,
  onUpdate,
}: {
  company: CompanyCard;
  statuses: { value: string; label: string }[];
  busy: boolean;
  onUpdate: (companyId: string, companyName: string, status: string) => void;
}) {
  return (
    <article className="rounded-lg border border-white/80 bg-white p-3 shadow-sm">
      <p className="break-words font-medium text-slate-900">{company.name}</p>
      <p className="mt-0.5 text-xs text-slate-500">CNPJ {company.cnpj}</p>
      <p className="mt-2 text-xs text-slate-600">
        {company.beneficiariesCount} beneficiário
        {company.beneficiariesCount === 1 ? "" : "s"} · {company.invoicesCount}{" "}
        fatura{company.invoicesCount === 1 ? "" : "s"}
      </p>
      <label className="mt-3 block text-xs font-medium text-slate-500">
        Mover para
        <select
          className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800"
          value={company.status}
          disabled={busy}
          onChange={(event) => onUpdate(company.id, company.name, event.target.value)}
        >
          {statuses.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}

export default function CrmPipelineView() {
  const { isBusy, run, showToast } = useAsyncAction();
  const [mobileStatus, setMobileStatus] = useState<string>("");

  const loadPipeline = useCallback(
    () =>
      fetchJson<PipelineData>("/api/interno/crm/pipeline", undefined, "Erro ao carregar pipeline"),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(loadPipeline, [], {
    forbiddenMessage: "Sem permissão para acessar o pipeline CRM",
  });

  const activeMobileStatus =
    data && mobileStatus && data.statuses.some((s) => s.value === mobileStatus)
      ? mobileStatus
      : (data?.statuses[0]?.value ?? "");

  const statusIds = useMemo(
    () => data?.statuses.map((s) => s.value) ?? [],
    [data?.statuses],
  );
  const { tabProps } = useRovingTablistKeyDown(
    statusIds,
    activeMobileStatus,
    setMobileStatus,
  );

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
          {/* Mobile: uma etapa por vez */}
          <div className="lg:hidden">
            <div className="ds-scroll-x flex gap-2 pb-1" role="tablist" aria-label="Etapas do pipeline">
              {data.statuses.map((status) => {
                const count = (data.pipeline[status.value] ?? []).length;
                const active = activeMobileStatus === status.value;
                return (
                  <button
                    key={status.value}
                    type="button"
                    {...tabProps(status.value)}
                    onClick={() => setMobileStatus(status.value)}
                    className={cn(
                      "min-h-10 shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]",
                      active
                        ? "border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]"
                        : "border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)]",
                    )}
                  >
                    {status.label}
                    <span className="ml-1.5 text-xs opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {data.statuses
              .filter((status) => status.value === activeMobileStatus)
              .map((status) => {
                const cards = data.pipeline[status.value] ?? [];
                return (
                  <div
                    key={status.value}
                    className={`mt-3 rounded-xl border p-3 ${columnClassForStatus(status.value)}`}
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
                        <CompanyPipelineCard
                          key={company.id}
                          company={company}
                          statuses={data.statuses}
                          busy={isBusy(company.id)}
                          onUpdate={updateStatus}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Desktop: kanban horizontal */}
          <div className="hidden ds-scroll-x gap-4 pb-2 lg:flex">
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
                      <CompanyPipelineCard
                        key={company.id}
                        company={company}
                        statuses={data.statuses}
                        busy={isBusy(company.id)}
                        onUpdate={updateStatus}
                      />
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
