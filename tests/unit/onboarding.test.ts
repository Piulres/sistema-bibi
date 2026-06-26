import { describe, expect, it } from "vitest";
import { matchesRoute } from "@/lib/onboarding/match-route";
import { buildTourSteps, countTourSteps } from "@/lib/onboarding/tours";
import {
  buildInternoFeatures,
  buildBeneficiarioFeatures,
  filterByPermissions,
} from "@/lib/onboarding/feature-map";
import { _parseState } from "@/lib/onboarding/storage";
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
  });
});

describe("onboarding feature-map", () => {
  it("maps all 13 interno modules for ADMIN", () => {
    const features = buildInternoFeatures(labels);
    const navModules = features.filter((s) => s.id.startsWith("nav-") && s.id !== "nav-overview");
    expect(navModules.length).toBe(13);
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
    expect(recepcao.some((s) => s.id === "nav-billing")).toBe(false);
    expect(recepcao.some((s) => s.id === "nav-agenda")).toBe(true);
  });

  it("maps all beneficiario nav tabs", () => {
    const features = buildBeneficiarioFeatures(labels);
    const navTabs = features.filter((s) => s.id.startsWith("nav-") && s.id !== "nav-overview");
    expect(navTabs.length).toBe(11);
  });
});

describe("onboarding tours", () => {
  it("builds interno tour with page-specific steps on dashboard", () => {
    const steps = buildTourSteps("interno", { labels }, "/interno/dashboard");
    expect(steps.some((s) => s.id === "welcome")).toBe(true);
    expect(steps.some((s) => s.id === "page-dashboard")).toBe(true);
    expect(steps.some((s) => s.id === "content-fallback")).toBe(false);
    expect(steps.some((s) => s.id === "nav-billing")).toBe(true);
  });

  it("includes walk-in hotspot on agenda route", () => {
    const steps = buildTourSteps("interno", { labels }, "/interno/agenda");
    expect(steps.some((s) => s.id === "page-agenda-walkin")).toBe(true);
    expect(steps.some((s) => s.target.includes("walk-in-callout"))).toBe(true);
  });

  it("includes billing pending hotspot on faturamento", () => {
    const steps = buildTourSteps("interno", { labels }, "/interno");
    expect(steps.some((s) => s.id === "page-billing")).toBe(true);
  });

  it("builds complete prestador tour with all nav tabs", () => {
    const steps = buildTourSteps("prestador", { labels }, "/prestador/dashboard");
    expect(steps.filter((s) => s.id.startsWith("nav-")).length).toBeGreaterThanOrEqual(6);
    expect(steps.some((s) => s.id === "page-dashboard")).toBe(true);
  });

  it("builds complete PJ tour with all sections", () => {
    const steps = buildTourSteps("pj", { labels }, "/pj");
    expect(steps.some((s) => s.id === "page-assinaturas")).toBe(true);
    expect(steps.some((s) => s.id === "page-faturas")).toBe(true);
  });

  it("builds complete beneficiario tour", () => {
    const steps = buildTourSteps("beneficiario", { labels }, "/beneficiario/agendar");
    expect(steps.some((s) => s.id === "page-agendar")).toBe(true);
    expect(countTourSteps("beneficiario", { labels })).toBeGreaterThan(20);
  });

  it("respects interno RBAC in built tour", () => {
    const steps = buildTourSteps(
      "interno",
      { labels, permissions: ["dashboard", "billing"] },
      "/interno/dashboard",
    );
    expect(steps.some((s) => s.id === "nav-agenda")).toBe(false);
    expect(steps.some((s) => s.id === "nav-billing")).toBe(true);
  });
});

describe("onboarding storage", () => {
  it("uses version 2 for new tours", () => {
    expect(ONBOARDING_VERSION).toBe(2);
  });

  it("parses valid JSON state", () => {
    const state = _parseState('{"interno":{"completed":true,"version":1}}');
    expect(state.interno?.completed).toBe(true);
  });
});
