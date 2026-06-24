"use client";

import type { AssistantMessage } from "@/lib/assistant/types";

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-[var(--text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function MessageBlock({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[var(--portal-accent)] text-[var(--text-inverse)]"
            : "bg-[var(--surface-muted)] text-[var(--text-secondary)]"
        }`}
      >
        {isUser ? message.content : renderInlineMarkdown(message.content)}
      </div>
    </div>
  );
}

type Props = {
  messages: AssistantMessage[];
  loading: boolean;
};

export default function AssistantMessageList({ messages, loading }: Props) {
  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-1 flex-col justify-end gap-3 p-4 text-sm text-[var(--text-muted)]">
        <p>Pergunte em linguagem natural, por exemplo:</p>
        <ul className="list-disc space-y-1 pl-4">
          <li>Quantos agendamentos temos hoje?</li>
          <li>Qual a receita de ontem?</li>
          <li>Quem está devendo?</li>
          <li>Resumo do dashboard</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((message, index) => (
        <MessageBlock key={`${message.role}-${index}`} message={message} />
      ))}
      {loading && (
        <div className="text-sm text-[var(--text-muted)]" aria-live="polite">
          Consultando dados…
        </div>
      )}
    </div>
  );
}
