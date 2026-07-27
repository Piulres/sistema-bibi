import { ImageResponse } from "next/og";
import { brandMarkPwaInput } from "@/lib/brand/brand-mark";
import { OgBrandMark } from "@/lib/brand/brand-mark-og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <OgBrandMark input={brandMarkPwaInput()} size={180} />,
    { ...size },
  );
}
