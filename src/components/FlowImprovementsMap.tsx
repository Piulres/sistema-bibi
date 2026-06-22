"use client";

import { useMemo, useState } from "react";
import {
  FLOW_PORTALS,
  type FlowImprovementStatus,
  type FlowPortalFilter,
  countFlowByStatus,
  filterFlowImprovementsByPortal,
} from "@/lib/flow-improvements-map";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const STATUS_LABEL: Record<FlowImprovementStatus, string> = {
  implemented: "Implementado",
  partial: "Parcial",
  planned: "Planejado",
};

const STATUS_TONE: Record<FlowImprovementStatus, "success" | "warning" | "neutral"> = {
  implemented: "success",
  partial: "warning",
  planned: "neutral",
};

export default function FlowImprovementsMap() {
  const [portal, setPortal] = useState<FlowPortalFilter>("Todos");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const byPortal = filterFlowImprovementsByPortal(portal);
    const q = query.trim().toLowerCase();
    if (!q) return byPortal;
    return byPortal.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.flow.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        row.ui?.toLowerCase().includes(q) ||
        row.api?.toLowerCase().includes(q),
    );
  }, [portal, query]);

  const counts = countFlowByStatus(rows);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        Melhorias de fluxo implementadas e backlog — onde cada passo aparece na interface e qual API
        suporta a ação.
      </p>

      <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
        <span>
          <strong className="text-[var(--status-success-text)]">{counts.implemented}</strong>{" "}
          implementadas
        </span>
        <span>·</span>
        <span>
          <strong className="text-[var(--status-warning-text)]">{counts.partial}</strong> parciais
        </span>
        <span>·</span>
        <span>
          <strong>{counts.planned}</strong> planejadas
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FLOW_PORTALS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={portal === p ? "primary" : "secondary"}
              onClick={() => setPortal(p)}
            >
              {p}
            </Button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Buscar fluxo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm sm:max-w-xs"
        />
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Nenhuma melhoria encontrada.</p>
        ) : (
          rows.map((item) => (
            <Card key={item.id} padding="sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[var(--text-primary)]">{item.title}</h3>
                    <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                    <Badge tone="neutral">{item.portal}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{item.flow}</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.description}</p>
                  {item.ui ? (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">UI: {item.ui}</p>
                  ) : null}
                  {item.api ? (
                    <p className="font-mono text-[10px] text-[var(--text-muted)]">{item.api}</p>
                  ) : null}
                  {item.docRef ? (
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">Ref: {item.docRef}</p>
                  ) : null}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
