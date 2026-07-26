"use client";

import { useAssistant } from "@/components/assistant/AssistantProvider";

export default function AssistantTrigger() {
  const { open, setOpen } = useAssistant();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-controls="assistant-panel"
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--portal-accent)] text-lg text-[var(--text-inverse)] shadow-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2"
      title="Abrir assistente"
      data-tour-id="portal-assistant"
    >
      <span aria-hidden>💬</span>
      <span className="sr-only">Abrir assistente</span>
    </button>
  );
}
