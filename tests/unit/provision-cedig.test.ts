import { describe, expect, it } from "vitest";
import {
  isValidProvisionCedigConfirmation,
  PROVISION_CEDIG_CONFIRM,
} from "../../src/lib/operation/provision-cedig";

describe("provision-cedig confirmation", () => {
  it("aceita CEDIG (case-insensitive)", () => {
    expect(isValidProvisionCedigConfirmation("CEDIG")).toBe(true);
    expect(isValidProvisionCedigConfirmation("cedig")).toBe(true);
    expect(isValidProvisionCedigConfirmation(" Cedig ")).toBe(true);
    expect(PROVISION_CEDIG_CONFIRM).toBe("CEDIG");
  });

  it("rejeita confirmações inválidas", () => {
    expect(isValidProvisionCedigConfirmation(undefined)).toBe(false);
    expect(isValidProvisionCedigConfirmation("")).toBe(false);
    expect(isValidProvisionCedigConfirmation("OPERAR")).toBe(false);
  });
});
