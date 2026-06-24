"use client";

import { useEffect, useRef } from "react";
import Alert from "@/components/ui/Alert";
import { useAssistant } from "@/components/assistant/AssistantProvider";
import AssistantMessageList from "@/components/assistant/AssistantMessageList";
import AssistantActionCard from "@/components/assistant/AssistantActionCard";
import AssistantComposer from "@/components/assistant/AssistantComposer";
import type { PortalKey } from "@/lib/roles";

type Props = {
  portal: PortalKey;
};

export default function AssistantPanel({ portal }: Props) {
  const { open, setOpen, messages, actions, loading, error } = useAssistant();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/30 lg:bg-transparent"
        aria-label="Fechar assistente"
        onClick={() => setOpen(false)}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-label="Assistente ServiceOS"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[var(--border-muted)] bg-[var(--surface-card)] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[var(--border-muted)] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Assistente</p>
            <p className="text-xs text-[var(--text-muted)]">Consultas operacionais guiadas</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-1 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        {error && (
          <div className="px-4 pt-3">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        <AssistantMessageList messages={messages} loading={loading} />
        <AssistantActionCard actions={actions} />
        <AssistantComposer portal={portal} />
      </aside>
    </>
  );
}
