"use client";

import { useMemo, useState } from "react";
import {
  CRUD_PORTALS,
  type CrudOperationDetail,
  type CrudPortalFilter,
  filterCrudMapByPortal,
} from "@/lib/crud-operations-map";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import SectionHeader from "@/components/ui/SectionHeader";

const EXPOSURE_LABEL: Record<CrudOperationDetail["exposure"], string> = {
  ui: "UI",
  "api-only": "API",
  cron: "Cron",
  download: "Download",
};

function OperationList({ ops }: { ops: CrudOperationDetail[] }) {
  if (ops.length === 0 || (ops.length === 1 && ops[0]!.label.startsWith("—"))) {
    return <span className="text-[var(--text-muted)]">—</span>;
  }

  return (
    <ul className="space-y-2">
      {ops.map((op, i) => (
        <li key={`${op.label}-${i}`} className="text-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-[var(--text-primary)]">{op.label}</span>
            <Badge tone="neutral" className="rounded-md border border-[var(--border-muted)] bg-transparent text-[10px]">
              {EXPOSURE_LABEL[op.exposure]}
            </Badge>
          </div>
          {op.ui ? (
            <p className="text-xs text-[var(--text-muted)]">{op.ui}</p>
          ) : null}
          {op.api ? (
            <p className="font-mono text-[10px] text-[var(--text-muted)]">{op.api}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function CrudOperationsMap() {
  const [portal, setPortal] = useState<CrudPortalFilter>("Todos");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const byPortal = filterCrudMapByPortal(portal);
    const q = query.trim().toLowerCase();
    if (!q) return byPortal;
    return byPortal.filter(
      (row) =>
        row.entity.toLowerCase().includes(q) ||
        row.description?.toLowerCase().includes(q) ||
        [...row.create, ...row.read, ...row.update, ...row.delete].some(
          (op) =>
            op.label.toLowerCase().includes(q) ||
            op.ui?.toLowerCase().includes(q) ||
            op.api?.toLowerCase().includes(q),
        ),
    );
  }, [portal, query]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        Mapa completo de operações do sistema: onde cada ação aparece na interface, qual API
        correspondente e se é exclusiva de cron/API.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CRUD_PORTALS.map((p) => (
            <Button
              key={p}
              type="button"
              size="sm"
              variant={portal === p ? "portal" : "secondary"}
              onClick={() => setPortal(p)}
            >
              {p}
            </Button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Buscar entidade, tela ou API…"
          className="w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm sm:max-w-xs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        {rows.length} entidade{rows.length === 1 ? "" : "s"}
        {query ? ` · busca: “${query}”` : portal !== "Todos" ? ` · portal ${portal}` : ""}
      </p>

      <div className="space-y-4">
        {rows.map((row) => (
          <Card key={`${row.portal}-${row.entity}`} padding="sm">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">{row.entity}</h3>
                {row.description ? (
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{row.description}</p>
                ) : null}
              </div>
              <Badge tone="brand" className="rounded-md">
                {row.portal}
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Criar
                </p>
                <OperationList ops={row.create} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Ler
                </p>
                <OperationList ops={row.read} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Atualizar
                </p>
                <OperationList ops={row.update} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Excluir
                </p>
                <OperationList ops={row.delete} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Nenhuma entidade encontrada.</p>
      ) : null}

      <Card>
        <SectionHeader title="Legenda" />
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--text-muted)]">
          <li>
            <strong className="text-[var(--text-secondary)]">UI</strong> — ação disponível em tela
            para usuários do portal.
          </li>
          <li>
            <strong className="text-[var(--text-secondary)]">Download</strong> — exportação de
            arquivo (CSV, XML, JSON).
          </li>
          <li>
            <strong className="text-[var(--text-secondary)]">API</strong> — endpoint sem tela
            dedicada (ex.: introspecção de sessão).
          </li>
          <li>
            <strong className="text-[var(--text-secondary)]">Cron</strong> — job agendado; geralmente
            existe equivalente manual na UI interna.
          </li>
          <li>
            <strong className="text-[var(--text-secondary)]">Walk-in particular</strong> — paciente sem
            PJ; cadastro + agendamento em <code className="text-xs">/interno/agenda</code>.
          </li>
        </ul>
      </Card>
    </div>
  );
}
