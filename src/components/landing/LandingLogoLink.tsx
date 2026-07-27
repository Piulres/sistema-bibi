import type { BrandingTokens } from "@/lib/theme/tokens";
import HomeBrandLink from "@/components/brand/HomeBrandLink";

type Props = {
  branding: BrandingTokens;
};

/** Marca da landing — herda mesh do TenantTheme (mesmo caminho dos portais). */
export default function LandingLogoLink({ branding }: Props) {
  return (
    <HomeBrandLink
      displayName={branding.displayName}
      markText={branding.markText}
      logoUrl={branding.logoUrl}
      useThemeColors
      logoSize="lg"
    />
  );
}
