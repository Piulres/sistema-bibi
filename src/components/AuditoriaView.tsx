"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { changeFieldLabel, formatMetadataValue } from "@/lib/change-management";
import type { TimelineEventMetadata } from "@/lib/change-management";
import { RESTORE_CONFIRM_PHRASE } from "@/lib/change-management/policy";
import { TIMELINE_ENTITY_LABELS } from "@/lib/timeline-constants";
import ExportButtons from "@/components/ExportButtons";
import { useToast } from "@/components/ui/Toast";

type AuditEvent = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  createdAtLabel: string;
  actorName: string | null;
  metadata: TimelineEventMetadata | null;
  hasDiff: boolean;
  correlationId: string | null;
  reversesId: string | null;
  reversible: boolean;
};

type FilterOption = { value: string; label: string };

type AuditResponse = {
  events: AuditEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: {
    entityTypes: FilterOption[];
    actions: string[];
  };
};

function entityLink(event: AuditEvent): string | null {
  if (event.entityType === "Patient") {
    return `/interno/beneficiarios/${event.entityId}?from=/interno/auditoria`;
  }
  return null;
}

function AuditEventDiff({ metadata }: { metadata: TimelineEventMetadata }) {
  const fields = metadata.fieldsChanged ?? [];
  if (fields.length === 0) return null;

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--border-muted)] bg-[var(--surface-muted)]">
      <table className="w-full min-w-[20rem] text-left text-xs">
        <thead>
          <tr className="border-b border-[var(--border-muted)] text-[var(--text-muted)]">
            <th className="px-3 py-2 font-medium">Campo</th>
            <th className="px-3 py-2 font-medium">Antes</th>
            <th className="px-3 py-2 font-medium">Depois</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field} className="border-b border-[var(--border-muted)] last:border-0">
              <td className="px-3 py-2 font-medium text-[var(--text-secondary)]">
                {changeFieldLabel(field)}
              </td>
              <td className="px-3 py-2 text-[var(--text-muted)]">
                {formatMetadataValue(metadata.before?.[field])}
              </td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">
                {formatMetadataValue(metadata.after?.[field])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AuditoriaView() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [refreshToken, setRefreshToken] = useState(0);
  const [expandedDiffIds, setExpandedDiffIds] = useState<Set<string>>(new Set());
  const [restoreBusy, setRestoreBusy] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    (async () => {
      setBusy(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "50");
      if (entityType) params.set("entityType", entityType);
      if (action) params.set("action", action);
      if (search.trim()) params.set("search", search.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/interno/audit?${params}`);
      const json = (await res.json()) as AuditResponse;
      if (!active) return;
      if (res.ok) setData(json);
      setLoading(false);
      setBusy(false);
    })();
    return () => {
      active = false;
    };
  // Filtros aplicados via refreshToken; page para paginação.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot dos filtros no clique em "Aplicar"
  }, [page, refreshToken]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setRefreshToken((t) => t + 1);
  }

  function toggleDiff(eventId: string) {
    setExpandedDiffIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }

  async function restoreEvent(event: AuditEvent) {
    setRestoreBusy(event.id);
    try {
      const res = await fetch(`/api/interno/audit/${event.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: RESTORE_CONFIRM_PHRASE }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ message: data.error ?? "Falha ao restaurar", tone: "danger" });
        return;
      }
      showToast({ message: "Versão restaurada com sucesso", tone: "success" });
      setRefreshToken((t) => t + 1);
    } finally {
      setRestoreBusy(null);
    }
  }

  if (loading && !data) {
    return <LoadingState message="Carregando auditoria..." />;
  }

  const events = data?.events ?? [];
  const filters = data?.filters;

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader
          title="Filtros"
          description="Eventos de todo o tenant — timeline universal com paginação."
        />
        <form onSubmit={applyFilters} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Tipo de entidade</span>
            <select
              className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="">Todas</option>
              {filters?.entityTypes.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Ação</span>
            <select
              className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="">Todas</option>
              {filters?.actions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Busca na descrição</span>
            <input
              className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] px-3 py-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ex.: fatura, TechCorp..."
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">De</span>
            <input
              type="date"
              className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] px-3 py-2"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Até</span>
            <input
              type="date"
              className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] px-3 py-2"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <div className="flex items-end">
            <Button type="submit" variant="portal" disabled={busy}>
              {busy ? "Filtrando..." : "Aplicar filtros"}
            </Button>
          </div>
        </form>
      </Card>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            title="Eventos do sistema"
            description={
              data
                ? `${data.total} evento(s) · página ${data.page} de ${data.totalPages}`
                : undefined
            }
          />
          <ExportButtons
            baseUrl="/api/interno/audit/export"
            query={{
              entityType: entityType || undefined,
              action: action || undefined,
              search: search.trim() || undefined,
              from: from || undefined,
              to: to || undefined,
            }}
          />
        </div>
        {events.length === 0 ? (
          <EmptyState message="Nenhum evento encontrado para os filtros selecionados." />
        ) : (
          <ol className="relative mt-4 space-y-0 border-l border-[var(--border-default)] pl-6">
            {events.map((event) => {
              const href = entityLink(event);
              const showDiff = event.hasDiff && event.metadata;
              const diffOpen = expandedDiffIds.has(event.id);
              return (
                <li key={event.id} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[1.625rem] top-1.5 h-3 w-3 rounded-full border-2 border-[var(--surface-card)] bg-[var(--portal-accent)] ring-2 ring-[var(--surface-muted)]" />
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={event.action} map="timeline" />
                      <span className="text-xs text-[var(--text-muted)]">{event.createdAtLabel}</span>
                      {event.reversesId && (
                        <span className="text-xs text-[var(--text-muted)]">· reverte evento</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{event.description}</p>
                    {showDiff && (
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleDiff(event.id)}
                        >
                          {diffOpen ? "Ocultar alterações" : "Ver alterações"}
                        </Button>
                        {diffOpen && event.metadata && <AuditEventDiff metadata={event.metadata} />}
                        {event.reversible && event.hasDiff && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="ml-2"
                            disabled={restoreBusy === event.id}
                            onClick={() => restoreEvent(event)}
                          >
                            {restoreBusy === event.id ? "Restaurando…" : "Restaurar versão"}
                          </Button>
                        )}
                      </div>
                    )}
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {event.actorName ?? "Sistema"} ·{" "}
                      {TIMELINE_ENTITY_LABELS[event.entityType] ?? event.entityType}
                      {href && (
                        <>
                          {" · "}
                          <Link href={href} className="text-[var(--portal-accent)] hover:underline">
                            Ver beneficiário
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {data && data.totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1 || busy}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-[var(--text-muted)]">
              Página {data.page} de {data.totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= data.totalPages || busy}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </section>

      <Alert tone="info">
        Eventos de cadastro e precificação passam a registrar antes/depois quando disponível — use
        &quot;Ver alterações&quot; na linha do evento. Restore administrativo chega no Pacote C;
        valores já faturados em Pay Per Use permanecem congelados.
      </Alert>
    </div>
  );
}
