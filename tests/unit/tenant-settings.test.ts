import { describe, expect, it } from "vitest";
import {
  DEFAULT_TENANT_SETTINGS,
  mergeTenantSettings,
  parseTenantSettings,
  serializeTenantSettings,
} from "@/lib/tenant/settings";

describe("tenant settings", () => {
  it("retorna defaults quando settings ausente", () => {
    expect(parseTenantSettings(null)).toEqual(DEFAULT_TENANT_SETTINGS);
    expect(parseTenantSettings("")).toEqual(DEFAULT_TENANT_SETTINGS);
  });

  it("parseia assistant.aiEnabled", () => {
    const raw = serializeTenantSettings({
      assistant: { aiEnabled: true, rulesEnabled: true },
    });
    expect(parseTenantSettings(raw).assistant.aiEnabled).toBe(true);
  });

  it("ignora JSON inválido", () => {
    expect(parseTenantSettings("{bad")).toEqual(DEFAULT_TENANT_SETTINGS);
  });

  it("merge parcial preserva campos", () => {
    const merged = mergeTenantSettings(DEFAULT_TENANT_SETTINGS, {
      assistant: { aiEnabled: true },
    });
    expect(merged.assistant.aiEnabled).toBe(true);
    expect(merged.assistant.rulesEnabled).toBe(true);
  });
});
