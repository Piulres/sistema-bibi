import { describe, expect, it } from "vitest";
import {
  brandMarkFromBranding,
  brandMarkInitial,
  brandMarkMeshBackground,
  brandMarkText,
  buildBrandMarkSvg,
  resolveBrandMarkLayout,
} from "@/lib/brand/brand-mark";
import { PLATFORM_BRANDING } from "@/lib/theme/tokens";

describe("brandMarkText", () => {
  it("uses markText override on platform home so circle shows Bibi instead of S", () => {
    expect(
      brandMarkText({ displayName: "Sistema Bibi", markText: "Bibi" }),
    ).toBe("Bibi");
  });

  it("falls back to initial for tenant branding without markText", () => {
    expect(brandMarkText({ displayName: "Clínica Horizonte" })).toBe("C");
  });
});

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
  it("maps tenant hero gradient so whitelabel icons match energia brasileira branding", () => {
    const layout = resolveBrandMarkLayout(
      {
        displayName: "VitaCare",
        primaryColor: "#1d4ed8",
        accentColor: "#22d3ee",
        heroFrom: "#1e3a8a",
        heroTo: "#38bdf8",
      },
      512,
    );

    expect(layout.backgroundFrom).toBe("#1e3a8a");
    expect(layout.backgroundTo).toBe("#38bdf8");
    expect(layout.primaryColor).toBe("#1d4ed8");
    expect(layout.accentColor).toBe("#22d3ee");
    expect(layout.initial).toBe("V");
  });

  it("falls back to primary and accent when hero tokens are absent", () => {
    const layout = resolveBrandMarkLayout({
      displayName: "Demo",
      primaryColor: "#1e293b",
      accentColor: "#f97316",
    });

    expect(layout.backgroundFrom).toBe("#1e293b");
    expect(layout.backgroundTo).toBe("#f97316");
  });
});

describe("brandMarkMeshBackground", () => {
  it("layers radial glows over hero gradient so mark matches landing mesh hero", () => {
    const layout = resolveBrandMarkLayout(
      {
        displayName: "Bibi",
        primaryColor: "#1e293b",
        accentColor: "#f97316",
        heroFrom: "#1e293b",
        heroTo: "#f59e0b",
      },
      512,
    );

    const css = brandMarkMeshBackground(layout);
    expect(css).toContain("#1e293b");
    expect(css).toContain("#f59e0b");
    expect(css).toContain("radial-gradient");
    expect(css).toContain("linear-gradient");
  });

  it("uses segment whitelabel colors so each niche mark reflects tenant branding", () => {
    const vet = resolveBrandMarkLayout(
      {
        displayName: "PetCare",
        primaryColor: "#059669",
        accentColor: "#34d399",
        heroFrom: "#047857",
        heroTo: "#34d399",
      },
      512,
    );
    const svg = buildBrandMarkSvg(
      {
        displayName: "PetCare",
        primaryColor: vet.primaryColor,
        accentColor: vet.accentColor,
        heroFrom: vet.backgroundFrom,
        heroTo: vet.backgroundTo,
      },
      192,
    );

    expect(vet.backgroundFrom).toBe("#047857");
    expect(vet.backgroundTo).toBe("#34d399");
    expect(svg).toContain("#047857");
    expect(svg).toContain("#34d399");
    expect(svg).toContain(">P<");
  });
});

describe("buildBrandMarkSvg", () => {
  it("embeds tenant initial on energia gradient so API consumers get a self-contained mark", () => {
    const svg = buildBrandMarkSvg(
      {
        displayName: "Horizonte",
        primaryColor: "#1e293b",
        accentColor: "#f97316",
        heroFrom: "#1e293b",
        heroTo: "#f59e0b",
      },
      192,
    );

    expect(svg).toContain('<?xml version="1.0"');
    expect(svg).toContain('viewBox="0 0 192 192"');
    expect(svg).toContain(">H<");
    expect(svg).toContain("#1e293b");
    expect(svg).toContain("#f59e0b");
    expect(svg).not.toContain("#0a1018");
  });

  it("references logo URL when provided so tenants with upload keep mark centered", () => {
    const svg = buildBrandMarkSvg(
      {
        displayName: "CEDIG",
        logoUrl: "https://cdn.example/logo.png",
        primaryColor: "#0f172a",
        accentColor: "#f97316",
        heroFrom: "#0f172a",
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
    expect(input.markText).toBe(PLATFORM_BRANDING.markText);
    expect(input.primaryColor).toBe(PLATFORM_BRANDING.primaryColor);
    expect(input.accentColor).toBe(PLATFORM_BRANDING.accentColor);
    expect(input.heroFrom).toBe(PLATFORM_BRANDING.heroFrom);
    expect(input.heroTo).toBe(PLATFORM_BRANDING.heroTo);
  });

  it("renders Bibi in platform SVG while displayName stays Sistema Bibi", () => {
    const svg = buildBrandMarkSvg(brandMarkFromBranding(PLATFORM_BRANDING), 192);
    expect(svg).toContain(">Bibi<");
    expect(svg).not.toContain(">S<");
  });
});
