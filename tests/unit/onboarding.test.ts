import { describe, expect, it } from "vitest";
import { matchesRoute, filterStepsForRoute } from "@/lib/onboarding/match-route";
import { buildTourSteps } from "@/lib/onboarding/tours";
import { _parseState } from "@/lib/onboarding/storage";
import { getDefaultLabels } from "@/lib/niche/defaults";

const labels = getDefaultLabels("MEDICAL");

describe("onboarding match-route", () => {
  it("matches exact routes", () => {
    expect(matchesRoute("/interno/dashboard", "/interno/dashboard")).toBe(true);
    expect(matchesRoute("/interno/agenda", "/interno/dashboard")).toBe(false);
  });

  it("matches wildcard prefix routes", () => {
    expect(matchesRoute("/interno/agenda", "/interno/agenda*")).toBe(true);
    expect(matchesRoute("/interno/agenda/extra", "/interno/agenda*")).toBe(true);
    expect(matchesRoute("/interno/cadastros", "/interno/agenda*")).toBe(false);
  });

  it("includes steps without route filter", () => {
    const steps = [
      { id: "a", route: "/interno/dashboard" },
      { id: "b" },
    ];
    const filtered = filterStepsForRoute(steps, "/interno/dashboard");
    expect(filtered.map((s) => s.id)).toEqual(["a", "b"]);
  });
});

describe("onboarding tours", () => {
  it("builds interno tour with niche labels", () => {
    const steps = buildTourSteps("interno", { labels }, "/interno/dashboard");
    expect(steps.length).toBeGreaterThan(3);
    expect(steps.some((s) => s.title.includes("portal interno"))).toBe(true);
    expect(steps.some((s) => s.id === "dashboard")).toBe(true);
    expect(steps.some((s) => s.id === "content")).toBe(false);
  });

  it("prefers route-specific step over generic for same target", () => {
    const steps = buildTourSteps("interno", { labels }, "/interno/agenda");
    const contentSteps = steps.filter((s) => s.target.includes("portal-content"));
    expect(contentSteps).toHaveLength(1);
    expect(contentSteps[0]?.id).toBe("agenda");
  });

  it("builds tours for all portals", () => {
    const paths = {
      prestador: "/prestador/dashboard",
      pj: "/pj",
      beneficiario: "/beneficiario/resumo",
    } as const;
    for (const portal of ["prestador", "pj", "beneficiario"] as const) {
      const steps = buildTourSteps(portal, { labels }, paths[portal]);
      expect(steps.length).toBeGreaterThanOrEqual(4);
      expect(steps.some((s) => s.id === "welcome")).toBe(true);
      expect(steps.some((s) => s.id === "assistant")).toBe(true);
    }
  });
});

describe("onboarding storage parse", () => {
  it("parses valid JSON state", () => {
    const state = _parseState('{"interno":{"completed":true,"version":1}}');
    expect(state.interno?.completed).toBe(true);
  });

  it("returns empty on invalid JSON", () => {
    expect(_parseState("not-json")).toEqual({});
  });
});
