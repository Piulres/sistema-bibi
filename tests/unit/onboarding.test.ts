import { describe, expect, it, vi } from "vitest";
import { matchesRoute } from "@/lib/onboarding/match-route";
import {
  buildMainTourSteps,
  buildMicroTourSteps,
  buildTourSteps,
  countTourSteps,
} from "@/lib/onboarding/tours";
import {
  buildInternoFeatures,
  buildBeneficiarioFeatures,
  filterByPermissions,
} from "@/lib/onboarding/feature-map";
import {
  _parseState,
  isTourDismissed,
  markRouteTourCompleted,
  markTourDismissed,
  shouldAutoStartRouteTour,
} from "@/lib/onboarding/storage";
import { getRouteScopeKey, routeStorageKey } from "@/lib/onboarding/route-scope";
import { ONBOARDING_VERSION } from "@/lib/onboarding/types";
import { getDefaultLabels } from "@/lib/niche/defaults";

const labels = getDefaultLabels("MEDICAL");

describe("onboarding match-route", () => {
  it("matches exact routes", () => {
    expect(matchesRoute("/interno/dashboard", "/interno/dashboard")).toBe(true);
    expect(matchesRoute("/interno/agenda", "/interno/dashboard")).toBe(false);
  });

  it("matches wildcard prefix routes", () => {
    expect(matchesRoute("/interno/agenda", "/interno/agenda*")).toBe(true);
    expect(matchesRoute("/interno/cadastros", "/interno/agenda*")).toBe(false);
    expect(matchesRoute("/interno/beneficiarios/abc", "/interno/beneficiarios/*")).toBe(true);
  });
});

describe("onboarding route-scope", () => {
  it("resolves cliente-360 scope", () => {
    expect(getRouteScopeKey("interno", "/interno/beneficiarios/p1")).toBe("cliente-360");
    expect(routeStorageKey("interno", "cliente-360")).toBe("interno:cliente-360");
  });

  it("resolves atendimento scope for prestador", () => {
    expect(getRouteScopeKey("prestador", "/prestador/atendimento/x")).toBe("atendimento");
  });
});

describe("onboarding feature-map", () => {
  it("uses condensed nav-modules for interno", () => {
    const features = buildInternoFeatures(labels);
    expect(features.some((s) => s.id === "nav-modules")).toBe(true);
    expect(features.filter((s) => s.id.startsWith("nav-") && s.id !== "nav-overview" && s.id !== "nav-modules").length).toBe(0);
  });

  it("keeps page-specific steps for micro-tours", () => {
    const features = buildInternoFeatures(labels);
    expect(features.some((s) => s.id === "page-agenda-walkin")).toBe(true);
    expect(features.some((s) => s.id === "page-billing-cliente360")).toBe(true);
    expect(features.some((s) => s.id === "page-seguranca-reset")).toBe(true);
  });

  it("filters interno steps by RBAC", () => {
    const all = buildInternoFeatures(labels);
    const recepcao = filterByPermissions(all, [
      "dashboard",
      "agenda",
      "cadastros",
      "estoque",
      "comunicacao",
    ]);
    expect(recepcao.some((s) => s.id === "page-billing")).toBe(false);
    expect(recepcao.some((s) => s.id === "page-agenda-walkin")).toBe(true);
  });

  it("maps condensed beneficiario nav", () => {
    const features = buildBeneficiarioFeatures(labels);
    expect(features.some((s) => s.id === "nav-modules")).toBe(true);
  });
});

describe("onboarding tours", () => {
  it("builds shorter main interno tour on dashboard", () => {
    const steps = buildMainTourSteps("interno", { labels }, "/interno/dashboard");
    expect(steps.some((s) => s.id === "welcome")).toBe(true);
    expect(steps.some((s) => s.id === "nav-modules")).toBe(true);
    expect(steps.some((s) => s.id === "page-dashboard")).toBe(true);
    expect(steps.some((s) => s.id === "page-billing")).toBe(false);
    expect(steps.length).toBeLessThanOrEqual(7);
  });

  it("builds micro-tour on faturamento with hotspots", () => {
    const steps = buildMicroTourSteps("interno", { labels }, "/interno");
    expect(steps.some((s) => s.id === "page-billing")).toBe(true);
    expect(steps.some((s) => s.id === "page-billing-cliente360")).toBe(true);
  });

  it("includes walk-in hotspot on agenda micro-tour", () => {
    const steps = buildMicroTourSteps("interno", { labels }, "/interno/agenda");
    expect(steps.some((s) => s.id === "page-agenda-walkin")).toBe(true);
  });

  it("builds prestador main tour condensed", () => {
    const steps = buildMainTourSteps("prestador", { labels }, "/prestador/dashboard");
    expect(steps.some((s) => s.id === "nav-modules")).toBe(true);
    expect(steps.some((s) => s.id === "page-dashboard")).toBe(true);
  });

  it("builds prestador atendimento micro-tour with PEP hotspot", () => {
    const steps = buildMicroTourSteps("prestador", { labels }, "/prestador/atendimento/abc");
    expect(steps.some((s) => s.id === "page-atendimento")).toBe(true);
    expect(steps.some((s) => s.target.includes("atendimento-pep"))).toBe(true);
  });

  it("builds complete PJ tour with all sections", () => {
    const steps = buildTourSteps("pj", { labels }, "/pj");
    expect(steps.some((s) => s.id === "page-assinaturas")).toBe(true);
    expect(steps.some((s) => s.id === "page-faturas")).toBe(true);
  });

  it("builds beneficiario agendar micro-tour", () => {
    const steps = buildMicroTourSteps("beneficiario", { labels }, "/beneficiario/agendar");
    expect(steps.some((s) => s.id === "page-agendar")).toBe(true);
    expect(countTourSteps("beneficiario", { labels })).toBeGreaterThan(15);
  });

  it("builds beneficiario faturas micro-tour with PIX hotspot", () => {
    const steps = buildMicroTourSteps("beneficiario", { labels }, "/beneficiario/faturas");
    expect(steps.some((s) => s.id === "page-faturas")).toBe(true);
    expect(steps.some((s) => s.target.includes("beneficiario-pix-pay"))).toBe(true);
  });

  it("respects interno RBAC in micro-tour", () => {
    const steps = buildMicroTourSteps(
      "interno",
      { labels, permissions: ["dashboard", "billing"] },
      "/interno/agenda",
    );
    expect(steps.some((s) => s.id === "page-agenda-walkin")).toBe(false);
    const billing = buildMicroTourSteps(
      "interno",
      { labels, permissions: ["dashboard", "billing"] },
      "/interno",
    );
    expect(billing.some((s) => s.id === "page-billing")).toBe(true);
  });
});

describe("onboarding storage", () => {
  it("uses version 3 for new tours", () => {
    expect(ONBOARDING_VERSION).toBe(3);
  });

  it("parses valid JSON state", () => {
    const state = _parseState('{"interno":{"completed":true,"version":1}}');
    expect(state.interno?.completed).toBe(true);
  });

  it("tracks dismissed main tour without completion", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
    markTourDismissed("interno");
    expect(isTourDismissed("interno")).toBe(true);
    vi.unstubAllGlobals();
  });

  it("tracks per-route micro-tour completion", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
    markRouteTourCompleted("interno:agenda");
    expect(shouldAutoStartRouteTour("interno:agenda")).toBe(false);
    expect(shouldAutoStartRouteTour("interno:billing")).toBe(true);
    vi.unstubAllGlobals();
  });
});
