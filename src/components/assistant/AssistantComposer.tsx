"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import { useAssistant } from "@/components/assistant/AssistantProvider";
import { useLabels } from "@/hooks/useLabels";
import { buildPortalUiCopy } from "@/lib/assistant/portal-ui";
import { getPageContextSuggestions } from "@/lib/assistant/page-suggestions";
import type { PortalKey } from "@/lib/roles";

type Props = {
  portal: PortalKey;
};

export default function AssistantComposer({ portal }: Props) {
  const { sendMessage, loading } = useAssistant();
  const { labels } = useLabels();
  const pathname = usePathname();
  const [input, setInput] = useState("");

  const copy = useMemo(() => buildPortalUiCopy(portal, labels), [portal, labels]);
  const suggestions = useMemo(() => {
    const contextual = getPageContextSuggestions(portal, pathname, labels);
    const merged = [...contextual, ...copy.suggestions];
    return [...new Set(merged)].slice(0, 12);
  }, [portal, pathname, labels, copy.suggestions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const value = input;
    setInput("");
    await sendMessage(value);
  }

  return (
    <div className="border-t border-[var(--border-muted)] bg-[var(--surface-card)] p-3">
      <div className="mb-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
        {suggestions.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={loading}
            onClick={() => void sendMessage(chip)}
            className="rounded-full border border-[var(--border-muted)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={copy.placeholder}
          disabled={loading}
          className="min-w-0 flex-1 rounded-lg border border-[var(--border-muted)] bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
          aria-label="Mensagem para o assistente"
        />
        <Button type="submit" size="sm" disabled={loading || !input.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
