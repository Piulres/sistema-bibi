import { ImageResponse } from "next/og";
import { brandMarkFromBranding } from "@/lib/brand/brand-mark";
import { OgBrandMark } from "@/lib/brand/brand-mark-og";
import { getPlatformBranding } from "@/lib/theme/branding";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const branding = getPlatformBranding();
  return new ImageResponse(
    <OgBrandMark input={brandMarkFromBranding(branding)} size={180} />,
    { ...size },
  );
}
