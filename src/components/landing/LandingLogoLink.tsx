import type { BrandingTokens } from "@/lib/theme/tokens";
import HomeBrandLink from "@/components/brand/HomeBrandLink";

type Props = {
  branding: BrandingTokens;
};

/** @deprecated Prefer `HomeBrandLink` — mantido para imports da landing. */
export default function LandingLogoLink({ branding }: Props) {
  return (
    <HomeBrandLink
      displayName={branding.displayName}
      logoUrl={branding.logoUrl}
      logoSize="md"
    />
  );
}
