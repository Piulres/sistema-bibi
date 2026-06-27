import type { SeedCompany } from "./companies";
import { SEED_COMPANIES } from "./companies";
import { OPERATION_COMPANIES } from "./companies-operation";
import { resolveSeedProfile } from "./profile";

/** Empresas PJ conforme SEED_PROFILE (market = 50 · operation-1y = 20). */
export function resolveSeedCompanies(): SeedCompany[] {
  const profile = resolveSeedProfile();
  if (profile.profile === "operation-1y") {
    return OPERATION_COMPANIES;
  }
  return SEED_COMPANIES;
}
