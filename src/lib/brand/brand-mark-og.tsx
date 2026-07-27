import type { BrandMarkInput } from "@/lib/brand/brand-mark";
import { resolveBrandMarkLayout } from "@/lib/brand/brand-mark";

type OgBrandMarkProps = {
  input: BrandMarkInput;
  size: number;
};

/** JSX para ImageResponse (icon.tsx, apple-icon, script de PNG). */
export function OgBrandMark({ input, size }: OgBrandMarkProps) {
  const layout = resolveBrandMarkLayout(input, size);
  const inset = Math.round(size * 0.0625);
  const inner = size - inset * 2;
  const cx = size / 2;
  const cy = layout.circleCenterY;
  const r = layout.circleRadius;
  const logoPad = Math.round(r * 0.78);
  const logoSize = Math.round(r * 1.24);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        position: "relative",
        backgroundColor: layout.frameColor,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: inset,
          top: inset,
          width: inner,
          height: inner,
          backgroundColor: layout.canvasColor,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: cx - r,
          top: cy - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${layout.gradientFrom} 0%, ${layout.gradientTo} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {layout.logoUrl ? (
          <div
            style={{
              width: logoPad * 2,
              height: logoPad * 2,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
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
              fontSize: Math.round(r * 0.92),
              fontWeight: 700,
              lineHeight: 1,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {layout.initial}
          </span>
        )}
      </div>
    </div>
  );
}
