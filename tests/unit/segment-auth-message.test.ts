import { describe, expect, it } from "vitest";
import { buildSegmentMismatchMessage } from "@/lib/segment/auth-messages";

describe("buildSegmentMismatchMessage", () => {
  it("aponta para o tenant da conta (não o portal atual)", () => {
    const message = buildSegmentMismatchMessage({
      userName: "CEDIG Cruzeiro",
      userSlug: "cedig",
      currentPortal: "Clínica Bibi Saúde",
    });

    expect(message).toContain("CEDIG Cruzeiro");
    expect(message).toContain("?tenant=cedig");
    expect(message).not.toContain("?tenant=bibi-saude");
  });
});
