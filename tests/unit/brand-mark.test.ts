import { describe, expect, it } from "vitest";
import {
  brandMarkFromBranding,
  brandMarkInitial,
  buildBrandMarkSvg,
  resolveBrandMarkLayout,
} from "@/lib/brand/brand-mark";
import { PLATFORM_BRANDING } from "@/lib/theme/tokens";

describe("brandMarkInitial", () => {
  it("returns first letter uppercased so UI and PWA show a readable monogram", () => {
    expect(brandMarkInitial("Clínica Horizonte")).toBe("C");
    expect(brandMarkInitial("  petcare  ")).toBe("P");
  });

  it("falls back to B for empty names so platform mark never renders blank", () => {
    expect(brandMarkInitial("")).toBe("B");
    expect(brandMarkInitial("   ")).toBe("B");
  });
});

describe("resolveBrandMarkLayout", () => {
  it("maps tenant colors into circle gradient so whitelabel icons match branding", () => {
    const layout = resolveBrandMarkLayout(
      {
        displayName: "VitaCare",
        primaryColor: "#1d4ed8",
        accentColor: "#22d3ee",
        heroTo: "#38bdf8",
      },
      512,
    );

    expect(layout.canvasColor).toBe("#1d4ed8");
    expect(layout.gradientFrom).toBe("#22d3ee");
    expect(layout.gradientTo).toBe("#38bdf8");
    expect(layout.initial).toBe("V");
    expect(layout.circleRadius).toBeGreaterThan(0);
  });
});

describe("buildBrandMarkSvg", () => {
  it("embeds tenant initial in SVG so API consumers get a self-contained mark", () => {
    const svg = buildBrandMarkSvg(
      {
        displayName: "Horizonte",
        primaryColor: "#1e293b",
        accentColor: "#f97316",
        heroTo: "#f59e0b",
      },
      192,
    );

    expect(svg).toContain('<?xml version="1.0"');
    expect(svg).toContain('viewBox="0 0 192 192"');
    expect(svg).toContain(">H<");
    expect(svg).toContain("#f97316");
  });

  it("references logo URL when provided so tenants with upload keep mark in circle", () => {
    const svg = buildBrandMarkSvg(
      {
        displayName: "CEDIG",
        logoUrl: "https://cdn.example/logo.png",
        primaryColor: "#0f172a",
        accentColor: "#f97316",
        heroTo: "#f59e0b",
      },
      512,
    );

    expect(svg).toContain('href="https://cdn.example/logo.png"');
    expect(svg).not.toContain(">C<");
  });
});

describe("brandMarkFromBranding", () => {
  it("adapts platform tokens so icon.tsx and scripts share one source of truth", () => {
    const input = brandMarkFromBranding(PLATFORM_BRANDING);
    expect(input.displayName).toBe(PLATFORM_BRANDING.displayName);
    expect(input.primaryColor).toBe(PLATFORM_BRANDING.primaryColor);
    expect(input.accentColor).toBe(PLATFORM_BRANDING.accentColor);
  });
});
