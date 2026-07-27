"use client";

type Props = {
  label: string;
};

/** Indicador animado enquanto o assistente processa a mensagem. */
export default function AssistantTypingIndicator({ label }: Props) {
  return (
    <div className="flex justify-start" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-2 rounded-2xl bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm text-[var(--text-muted)]">
        <span className="sr-only">{label}</span>
        <span aria-hidden className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:300ms]" />
        </span>
        <span aria-hidden>{label}</span>
      </div>
    </div>
  );
}
