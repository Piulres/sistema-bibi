import { describe, expect, it, afterEach } from "vitest";
import {
  isDemoResetEnabled,
  isValidDemoResetConfirmation,
  canUserResetDemo,
} from "@/lib/demo-reset";

describe("demo-reset", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFlag = process.env.ALLOW_DEMO_RESET;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalFlag === undefined) delete process.env.ALLOW_DEMO_RESET;
    else process.env.ALLOW_DEMO_RESET = originalFlag;
  });

  it("habilita reset por padrao (dev e producao)", () => {
    process.env.NODE_ENV = "development";
    delete process.env.ALLOW_DEMO_RESET;
    expect(isDemoResetEnabled()).toBe(true);

    process.env.NODE_ENV = "production";
    delete process.env.ALLOW_DEMO_RESET;
    expect(isDemoResetEnabled()).toBe(true);
  });

  it("desabilita reset quando ALLOW_DEMO_RESET=false", () => {
    process.env.ALLOW_DEMO_RESET = "false";
    expect(isDemoResetEnabled()).toBe(false);
  });

  it("respeita ALLOW_DEMO_RESET=0", () => {
    process.env.ALLOW_DEMO_RESET = "0";
    expect(isDemoResetEnabled()).toBe(false);
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
