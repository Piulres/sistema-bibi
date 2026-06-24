"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AssistantAction, AssistantMessage } from "@/lib/assistant/types";
import { filterAssistantActions } from "@/lib/assistant/types";

type AssistantContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  messages: AssistantMessage[];
  actions: AssistantAction[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  confirmAction: (pendingActionId: string, confirmed: boolean, password?: string) => Promise<void>;
  clearError: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant deve ser usado dentro de AssistantProvider");
  return ctx;
}

type Props = {
  pageContext?: string;
  children: React.ReactNode;
};

export default function AssistantProvider({ pageContext, children }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [actions, setActions] = useState<AssistantAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || loading) return;

      const nextMessages: AssistantMessage[] = [
        ...messages,
        { role: "user", content: trimmed },
      ];
      setMessages(nextMessages);
      setLoading(true);
      setError(null);
      setActions([]);

      try {
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages, pageContext }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erro ao consultar o assistente");
          return;
        }
        setMessages((prev) => [...prev, data.message]);
        if (data.actions) setActions(filterAssistantActions(data.actions));
      } catch {
        setError("Falha de conexão com o assistente.");
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, pageContext],
  );

  const confirmAction = useCallback(
    async (pendingActionId: string, confirmed: boolean, password?: string) => {
      if (loading) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/assistant/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pendingActionId, confirmed, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erro ao confirmar ação");
          return;
        }
        setMessages((prev) => [...prev, data.message]);
        setActions([]);
      } catch {
        setError("Falha de conexão ao confirmar.");
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  const value = useMemo(
    () => ({
      open,
      setOpen,
      messages,
      actions,
      loading,
      error,
      sendMessage,
      confirmAction,
      clearError: () => setError(null),
    }),
    [open, messages, actions, loading, error, sendMessage, confirmAction],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}
