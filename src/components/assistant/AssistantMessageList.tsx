"use client";

import { useEffect, useMemo, useRef } from "react";
import type { AssistantMessage } from "@/lib/assistant/types";
import { useLabels } from "@/hooks/useLabels";
import { buildPortalUiCopy } from "@/lib/assistant/portal-ui";
import AssistantTypingIndicator from "@/components/assistant/AssistantTypingIndicator";
import type { PortalKey } from "@/lib/roles";

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
  portal: PortalKey;
  messages: AssistantMessage[];
  loading: boolean;
};

export default function AssistantMessageList({ portal, messages, loading }: Props) {
  const { labels } = useLabels();
  const copy = useMemo(() => buildPortalUiCopy(portal, labels), [portal, labels]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto p-4 text-sm text-[var(--text-muted)]"
      >
        <p>{copy.emptyIntro}</p>
        <ul className="list-disc space-y-1 pl-4">
          {copy.emptyExamples.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
        <div ref={bottomRef} />
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((message, index) => (
        <MessageBlock key={`${message.role}-${index}`} message={message} />
      ))}
      {loading && <AssistantTypingIndicator label={copy.loading} />}
      <div ref={bottomRef} />
    </div>
  );
}
