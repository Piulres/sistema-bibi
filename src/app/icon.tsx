import { ImageResponse } from "next/og";
import { OgBrandMark } from "@/lib/brand/brand-mark-og";
import { getPlatformBranding } from "@/lib/theme/branding";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const branding = getPlatformBranding();
  return new ImageResponse(
    <OgBrandMark
      input={{
        displayName: branding.displayName,
        primaryColor: branding.primaryColor,
        accentColor: branding.accentColor,
        heroTo: branding.heroTo,
      }}
      size={32}
    />,
    { ...size },
  );
}
