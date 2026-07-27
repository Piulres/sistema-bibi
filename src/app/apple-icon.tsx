import { ImageResponse } from "next/og";
import { OgBrandMark } from "@/lib/brand/brand-mark-og";
import { getPlatformBranding } from "@/lib/theme/branding";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const branding = getPlatformBranding();
  return new ImageResponse(
    <OgBrandMark
      input={{
        displayName: branding.displayName,
        primaryColor: branding.primaryColor,
        accentColor: branding.accentColor,
        heroFrom: branding.heroFrom,
        heroTo: branding.heroTo,
      }}
      size={180}
    />,
    { ...size },
  );
}
