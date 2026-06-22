import { describe, expect, it, afterEach } from "vitest";
import { invalidateDataStoreModeCache } from "@/lib/data-store-mode";
import {
  isDemoResetEnabled,
  isValidDemoResetConfirmation,
  canUserResetDemo,
} from "@/lib/demo-reset";

describe("demo-reset", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFlag = process.env.ALLOW_DEMO_RESET;
  const originalNetlify = process.env.NETLIFY;
  const originalAppMode = process.env.APP_MODE;
  const originalDataStoreMode = process.env.DATA_STORE_MODE;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalFlag === undefined) delete process.env.ALLOW_DEMO_RESET;
    else process.env.ALLOW_DEMO_RESET = originalFlag;
    if (originalNetlify === undefined) delete process.env.NETLIFY;
    else process.env.NETLIFY = originalNetlify;
    if (originalAppMode === undefined) delete process.env.APP_MODE;
    else process.env.APP_MODE = originalAppMode;
    if (originalDataStoreMode === undefined) delete process.env.DATA_STORE_MODE;
    else process.env.DATA_STORE_MODE = originalDataStoreMode;
    invalidateDataStoreModeCache();
  });

  it("habilita reset fora de producao por padrao", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.ALLOW_DEMO_RESET;
    expect(await isDemoResetEnabled()).toBe(true);
  });

  it("habilita reset em producao Netlify POC (NETLIFY=true)", async () => {
    process.env.NODE_ENV = "production";
    process.env.NETLIFY = "true";
    delete process.env.ALLOW_DEMO_RESET;
    expect(await isDemoResetEnabled()).toBe(true);
  });

  it("desabilita reset em modo operacao", async () => {
    process.env.APP_MODE = "operation";
    process.env.NETLIFY = "true";
    process.env.ALLOW_DEMO_RESET = "true";
    expect(await isDemoResetEnabled()).toBe(false);
  });

  it("desabilita reset em producao fora da Netlify", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.NETLIFY;
    delete process.env.ALLOW_DEMO_RESET;
    expect(await isDemoResetEnabled()).toBe(false);
  });

  it("respeita ALLOW_DEMO_RESET=true em producao", async () => {
    process.env.NODE_ENV = "production";
    process.env.ALLOW_DEMO_RESET = "true";
    expect(await isDemoResetEnabled()).toBe(true);
  });

  it("exige frase RESTAURAR", () => {
    expect(isValidDemoResetConfirmation("RESTAURAR")).toBe(true);
    expect(isValidDemoResetConfirmation("restaurar")).toBe(true);
    expect(isValidDemoResetConfirmation("DEMO")).toBe(false);
  });

  it("so admin interno pode resetar", () => {
    const admin = {
      id: "1",
      email: "a@b.c",
      name: "A",
      role: "INTERNO",
      internoProfile: "ADMIN",
      tenantId: "t",
      companyId: null,
      patientId: null,
      tenantName: "T",
      companyName: null,
      patientName: null,
      internoPermissions: [],
      branding: {
        displayName: "T",
        primaryColor: "#000",
        accentColor: "#000",
        heroFrom: "#000",
        heroTo: "#000",
        platformLabel: "Bibi",
        colorScheme: "light" as const,
      },
    };
    const faturamento = { ...admin, internoProfile: "FATURAMENTO" };
    expect(canUserResetDemo(admin)).toBe(true);
    expect(canUserResetDemo(faturamento)).toBe(false);
  });
});
