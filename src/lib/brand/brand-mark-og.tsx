import type { BrandMarkInput } from "@/lib/brand/brand-mark";
import { brandMarkMeshBackground, resolveBrandMarkLayout } from "@/lib/brand/brand-mark";

type OgBrandMarkProps = {
  input: BrandMarkInput;
  size: number;
};

/** JSX para ImageResponse (icon.tsx, apple-icon, script de PNG). */
export function OgBrandMark({ input, size }: OgBrandMarkProps) {
  const layout = resolveBrandMarkLayout(input, size);
  const cx = size / 2;
  const cy = size / 2;
  const logoDiscR = Math.round(size * 0.28);
  const logoSize = Math.round(logoDiscR * 1.55);
  const initialSize = Math.round(size * 0.42);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: brandMarkMeshBackground(layout),
      }}
    >
      {layout.logoUrl ? (
        <div
          style={{
            width: logoDiscR * 2,
            height: logoDiscR * 2,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.94)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={layout.logoUrl}
            alt=""
            width={logoSize}
            height={logoSize}
            style={{ objectFit: "contain" }}
          />
        </div>
      ) : (
        <span
          style={{
            color: "#ffffff",
            fontSize: initialSize,
            fontWeight: 700,
            lineHeight: 1,
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 1px 2px rgba(0,0,0,0.15)",
            position: "absolute",
            left: cx,
            top: cy,
            transform: "translate(-50%, -50%)",
          }}
        >
          {layout.initial}
        </span>
      )}
    </div>
  );
}
