import { describe, expect, it, beforeEach } from "vitest";
import {
  clearAssistantChat,
  loadAssistantChat,
  saveAssistantChat,
} from "@/lib/assistant/chat-storage";

function createSessionStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("assistant chat-storage", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "sessionStorage", {
      value: createSessionStorageMock(),
      configurable: true,
    });
  });

  it("persiste e restaura mensagens por portal", () => {
    saveAssistantChat("interno", {
      messages: [
        { role: "user", content: "Olá" },
        { role: "assistant", content: "Oi!" },
      ],
      sessionState: "token-abc",
    });

    expect(loadAssistantChat("interno")).toEqual({
      messages: [
        { role: "user", content: "Olá" },
        { role: "assistant", content: "Oi!" },
      ],
      sessionState: "token-abc",
    });
    expect(loadAssistantChat("prestador")).toBeNull();
  });

  it("limpa conversa do portal", () => {
    saveAssistantChat("pj", {
      messages: [{ role: "user", content: "Resumo" }],
    });
    clearAssistantChat("pj");
    expect(loadAssistantChat("pj")).toBeNull();
  });

  it("ignora payload inválido", () => {
    sessionStorage.setItem("bibi_assistant_chat:interno", "{not-json");
    expect(loadAssistantChat("interno")).toBeNull();
  });
});
