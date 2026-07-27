import { ImageResponse } from "next/og";
import { brandMarkPwaInput } from "@/lib/brand/brand-mark";
import { OgBrandMark } from "@/lib/brand/brand-mark-og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <OgBrandMark input={brandMarkPwaInput()} size={32} />,
    { ...size },
  );
}
