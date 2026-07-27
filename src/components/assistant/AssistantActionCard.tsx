"use client";

import type { AssistantAction } from "@/lib/assistant/types";
import Link from "next/link";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAssistant } from "@/components/assistant/AssistantProvider";
import { formatChoiceFieldTitle } from "@/lib/assistant/tool-labels";

type Props = {
  actions: AssistantAction[];
};

export default function AssistantActionCard({ actions }: Props) {
  const { confirmAction, sendMessage, loading, setOpen } = useAssistant();
  const [password, setPassword] = useState("");
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visibleActions = actions.filter((_, index) => !dismissed.has(index));
  if (visibleActions.length === 0) return null;

  const closeOnNavigate = () => setOpen(false);
  const dismissAt = (index: number) => setDismissed((prev) => new Set(prev).add(index));

  return (
    <div className="space-y-2 border-t border-[var(--border-muted)] p-3">
      {actions.map((action, index) => {
        if (dismissed.has(index)) return null;

        if (action.type === "confirm") {
          const needsPassword =
            action.title.toLowerCase().includes("usuário") ||
            action.title.toLowerCase().includes("usuario") ||
            "E-mail" in action.summary;
          return (
            <Card key={`confirm-${index}`} className="space-y-3 p-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{action.title}</p>
              <dl className="space-y-1 text-xs text-[var(--text-secondary)]">
                {Object.entries(action.summary).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-3">
                    <dt className="text-[var(--text-muted)]">{key}</dt>
                    <dd className="text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              {needsPassword && (
                <label className="block text-xs text-[var(--text-secondary)]">
                  Senha inicial do usuário
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="mt-1 w-full rounded-lg border border-[var(--border-muted)] px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                  />
                </label>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={loading}
                  onClick={() => void confirmAction(action.pendingActionId, true, password || undefined)}
                >
                  Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => void confirmAction(action.pendingActionId, false)}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          );
        }

        if (action.type === "link") {
          return (
            <div key={`link-${index}`} className="flex items-stretch gap-2">
              <Link
                href={action.href}
                onClick={closeOnNavigate}
                className="block flex-1 rounded-lg border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm font-medium text-[var(--portal-accent)] hover:bg-[var(--surface-muted)]"
              >
                {action.label} →
              </Link>
              <button
                type="button"
                onClick={() => dismissAt(index)}
                className="rounded-lg px-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                aria-label="Dispensar atalho"
              >
                ✕
              </button>
            </div>
          );
        }

        if (action.type === "choice") {
          const choiceTitle = formatChoiceFieldTitle(action.title);
          return (
            <Card key={`choice-${index}`} className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">{choiceTitle}</p>
                <button
                  type="button"
                  onClick={() => dismissAt(index)}
                  className="rounded px-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                  aria-label="Fechar opções"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {action.options.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant="secondary"
                    disabled={loading}
                    className="justify-start text-left"
                    onClick={() => void sendMessage(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </Card>
          );
        }

        if (action.type === "form_draft") {
          return (
            <div key={`draft-${index}`} className="flex items-stretch gap-2">
              <Link
                href={action.href}
                onClick={closeOnNavigate}
                className="block flex-1 rounded-lg border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm font-medium text-[var(--portal-accent)] hover:bg-[var(--surface-muted)]"
              >
                {action.label} →
              </Link>
              <button
                type="button"
                onClick={() => dismissAt(index)}
                className="rounded-lg px-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                aria-label="Dispensar rascunho"
              >
                ✕
              </button>
            </div>
          );
        }

        if (action.type === "table") {
          if (!action.columns?.length) return null;
          return (
            <Card key={`table-${index}`} className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-[var(--border-muted)] px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {action.title}
                </span>
                <button
                  type="button"
                  onClick={() => dismissAt(index)}
                  className="rounded px-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                  aria-label="Fechar tabela"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                      {action.columns.map((col) => (
                        <th key={col} className="px-3 py-2 font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(action.rows ?? []).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-[var(--border-muted)]">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 text-[var(--text-secondary)]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        }

        return null;
      })}
    </div>
  );
}
