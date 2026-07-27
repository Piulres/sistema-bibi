import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { resolveAssistantMode, assistantModeLabel } from "@/lib/assistant/mode";
import { DEFAULT_TENANT_SETTINGS } from "@/lib/tenant/settings";

describe("assistant mode", () => {
  const env = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("modo regras quando IA desligada", () => {
    expect(resolveAssistantMode(DEFAULT_TENANT_SETTINGS)).toBe("rules");
    expect(assistantModeLabel("rules")).toMatch(/regras/i);
  });

  it("modo regras quando IA ligada mas gateway ausente", () => {
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_API_KEY;
    const settings = {
      assistant: { aiEnabled: true, rulesEnabled: true },
    };
    expect(resolveAssistantMode(settings)).toBe("rules");
  });

  it("modo IA quando flag tenant + gateway configurado", () => {
    process.env.OPENAI_BASE_URL = "https://gateway.example/v1";
    process.env.OPENAI_API_KEY = "test-key";
    const settings = {
      assistant: { aiEnabled: true, rulesEnabled: true },
    };
    expect(resolveAssistantMode(settings)).toBe("ai");
    expect(assistantModeLabel("ai")).toMatch(/IA/i);
  });
});
