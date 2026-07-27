"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AssistantAction, AssistantMessage } from "@/lib/assistant/types";
import { filterAssistantActions } from "@/lib/assistant/types";
import {
  clearAssistantChat,
  loadAssistantChat,
  saveAssistantChat,
} from "@/lib/assistant/chat-storage";
import type { PortalKey } from "@/lib/roles";

type AssistantContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  messages: AssistantMessage[];
  actions: AssistantAction[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  confirmAction: (pendingActionId: string, confirmed: boolean, password?: string) => Promise<void>;
  resetConversation: () => void;
  clearError: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant deve ser usado dentro de AssistantProvider");
  return ctx;
}

type Props = {
  portal: PortalKey;
  pageContext?: string;
  children: React.ReactNode;
};

export default function AssistantProvider({ portal, pageContext, children }: Props) {
  const [open, setOpenState] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>(
    () => loadAssistantChat(portal)?.messages ?? [],
  );
  const [actions, setActions] = useState<AssistantAction[]>([]);
  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    if (!next) setActions([]);
  }, []);
  const [sessionState, setSessionState] = useState<string | undefined>(
    () => loadAssistantChat(portal)?.sessionState,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (messages.length === 0 && !sessionState) {
      clearAssistantChat(portal);
      return;
    }
    saveAssistantChat(portal, { messages, sessionState });
  }, [messages, portal, sessionState]);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setActions([]);
    setSessionState(undefined);
    setError(null);
    clearAssistantChat(portal);
  }, [portal]);

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
          body: JSON.stringify({ messages: nextMessages, pageContext, sessionState }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erro ao consultar o assistente");
          return;
        }
        setMessages((prev) => [...prev, data.message]);
        if (data.actions) setActions(filterAssistantActions(data.actions));
        if (typeof data.sessionState === "string") {
          setSessionState(data.sessionState);
        } else if (data.sessionState === null) {
          setSessionState(undefined);
        }
      } catch {
        setError("Falha de conexão com o assistente.");
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, pageContext, sessionState],
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
        setSessionState(undefined);
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
      resetConversation,
      clearError: () => setError(null),
    }),
    [open, messages, actions, loading, error, sendMessage, confirmAction, resetConversation],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}
