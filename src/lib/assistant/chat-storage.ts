import type { AssistantMessage } from "@/lib/assistant/types";
import type { PortalKey } from "@/lib/roles";

const STORAGE_PREFIX = "bibi_assistant_chat";

export type PersistedAssistantChat = {
  messages: AssistantMessage[];
  sessionState?: string;
};

function storageKey(portal: PortalKey): string {
  return `${STORAGE_PREFIX}:${portal}`;
}

function getSessionStorage(): Storage | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage;
}

export function loadAssistantChat(portal: PortalKey): PersistedAssistantChat | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(storageKey(portal));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAssistantChat;
    if (!Array.isArray(parsed.messages)) return null;
    const messages = parsed.messages.filter(
      (item): item is AssistantMessage =>
        typeof item === "object" &&
        item !== null &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string",
    );
    return {
      messages,
      sessionState: typeof parsed.sessionState === "string" ? parsed.sessionState : undefined,
    };
  } catch {
    return null;
  }
}

export function saveAssistantChat(portal: PortalKey, state: PersistedAssistantChat): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(storageKey(portal), JSON.stringify(state));
  } catch {
    // sessionStorage cheio ou indisponível — ignora
  }
}

export function clearAssistantChat(portal: PortalKey): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(storageKey(portal));
  } catch {
    // ignora
  }
}
