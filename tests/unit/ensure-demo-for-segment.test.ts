import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEMO_ONLY_SEGMENT_EMAILS,
  DEMO_SEGMENT_TENANT_SLUGS,
  ensureDemoDataStoreForSegmentAccess,
  isDemoOnlySegmentEmail,
  isDemoSegmentTenantSlug,
} from "@/lib/data-store/ensure-demo-for-segment";

const { getDataStoreMode, setDataStoreMode, isDualDataStoreEnabled } = vi.hoisted(() => ({
  getDataStoreMode: vi.fn(),
  setDataStoreMode: vi.fn(),
  isDualDataStoreEnabled: vi.fn(),
}));

const { invalidatePrismaCache } = vi.hoisted(() => ({
  invalidatePrismaCache: vi.fn(),
}));

vi.mock("@/lib/data-store-mode", () => ({
  getDataStoreMode,
  setDataStoreMode,
  isDualDataStoreEnabled,
}));

vi.mock("@/lib/db", () => ({
  invalidatePrismaCache,
}));

describe("ensure-demo-for-segment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDualDataStoreEnabled.mockReturnValue(true);
    getDataStoreMode.mockResolvedValue("operation");
    setDataStoreMode.mockResolvedValue(undefined);
    invalidatePrismaCache.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reconhece slugs demo de segmento", () => {
    expect(isDemoSegmentTenantSlug("petcare")).toBe(true);
    expect(isDemoSegmentTenantSlug("horizonte")).toBe(true);
    expect(isDemoSegmentTenantSlug("bibi-saude")).toBe(false);
  });

  it("identifica e-mails exclusivos do modo demo", () => {
    expect(isDemoOnlySegmentEmail("operacao@petcare.demo")).toBe(true);
    expect(isDemoOnlySegmentEmail("faturamento@bibi.health")).toBe(false);
    expect(DEMO_ONLY_SEGMENT_EMAILS.has("operacao@petcare.demo")).toBe(true);
    expect(DEMO_SEGMENT_TENANT_SLUGS.has("petcare")).toBe(true);
  });

  it("alterna para demo ao acessar landing de segmento", async () => {
    const mode = await ensureDemoDataStoreForSegmentAccess({ segmentLanding: true });

    expect(mode).toBe("demo");
    expect(setDataStoreMode).toHaveBeenCalledWith("demo");
    expect(invalidatePrismaCache).toHaveBeenCalled();
  });

  it("alterna para demo com tenant slug de segmento", async () => {
    await ensureDemoDataStoreForSegmentAccess({ tenantSlug: "petcare" });

    expect(setDataStoreMode).toHaveBeenCalledWith("demo");
  });

  it("alterna para demo com e-mail exclusivo de segmento", async () => {
    await ensureDemoDataStoreForSegmentAccess({ email: "operacao@petcare.demo" });

    expect(setDataStoreMode).toHaveBeenCalledWith("demo");
  });

  it("mantém operação sem contexto de segmento", async () => {
    const mode = await ensureDemoDataStoreForSegmentAccess();

    expect(mode).toBe("operation");
    expect(setDataStoreMode).not.toHaveBeenCalled();
  });

  it("não regrava modo quando já está em demo", async () => {
    getDataStoreMode.mockResolvedValue("demo");

    const mode = await ensureDemoDataStoreForSegmentAccess({ tenantSlug: "petcare" });

    expect(mode).toBe("demo");
    expect(setDataStoreMode).not.toHaveBeenCalled();
  });
});
