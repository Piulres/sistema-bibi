"use client";

import type { AssistantAction } from "@/lib/assistant/types";
import Link from "next/link";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAssistant } from "@/components/assistant/AssistantProvider";

type Props = {
  actions: AssistantAction[];
};

export default function AssistantActionCard({ actions }: Props) {
  const { confirmAction, loading } = useAssistant();
  const [password, setPassword] = useState("");

  if (actions.length === 0) return null;

  return (
    <div className="space-y-2 border-t border-[var(--border-muted)] p-3">
      {actions.map((action, index) => {
        if (action.type === "confirm") {
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha (se criação de usuário)"
                className="w-full rounded-lg border border-[var(--border-muted)] px-3 py-2 text-xs"
              />
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
            <Link
              key={`link-${index}`}
              href={action.href}
              className="block rounded-lg border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm font-medium text-[var(--portal-accent)] hover:bg-[var(--surface-muted)]"
            >
              {action.label} →
            </Link>
          );
        }

        return (
          <Card key={`table-${index}`} className="overflow-hidden p-0">
            <div className="border-b border-[var(--border-muted)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {action.title}
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
                  {action.rows.map((row, rowIndex) => (
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
      })}
    </div>
  );
}
