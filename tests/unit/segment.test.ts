import { describe, expect, it } from "vitest";
import {
  SEGMENT_TENANTS,
  SEGMENT_SLUG_BY_NICHE,
  segmentTenantByNiche,
} from "@/lib/niche/demo-accounts";
import { appendSegmentToPath, buildSegmentSearchParams } from "@/lib/segment/types";

describe("segment.demo-accounts", () => {
  it("define slug único por segmento demo", () => {
    const slugs = SEGMENT_TENANTS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(SEGMENT_SLUG_BY_NICHE.VET).toBe("petcare");
    expect(segmentTenantByNiche("LEGAL").internoEmail).toBe("operacao@lex.demo");
    expect(segmentTenantByNiche("CONSTRUCTION").slug).toBe("build");
  });
});

describe("segment.buildSegmentSearchParams", () => {
  it("prioriza tenant sobre niche na query", () => {
    expect(buildSegmentSearchParams({ tenantSlug: "petcare", niche: "VET" })).toBe(
      "?tenant=petcare",
    );
    expect(buildSegmentSearchParams({ niche: "VET" })).toBe("?niche=VET");
    expect(buildSegmentSearchParams({ niche: "MEDICAL" })).toBe("");
  });

  it("propaga segmento nos links de login", () => {
    expect(appendSegmentToPath("/interno/login", { tenantSlug: "zen" })).toBe(
      "/interno/login?tenant=zen",
    );
  });
});
