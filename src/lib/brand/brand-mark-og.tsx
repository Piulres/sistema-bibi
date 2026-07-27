import type { BrandMarkInput } from "@/lib/brand/brand-mark";
import { brandMarkFontSizePx, brandMarkMeshBackground, resolveBrandMarkLayout } from "@/lib/brand/brand-mark";

type OgBrandMarkProps = {
  input: BrandMarkInput;
  size: number;
};

/** JSX para ImageResponse (icon.tsx, apple-icon, script de PNG). */
export function OgBrandMark({ input, size }: OgBrandMarkProps) {
  const layout = resolveBrandMarkLayout(input, size);
  const logoSize = Math.round(size * 0.58);
  const initialSize = brandMarkFontSizePx(size, layout.initial);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        overflow: "hidden",
        background: brandMarkMeshBackground(layout),
      }}
    >
      {layout.logoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={layout.logoUrl}
          alt=""
          width={logoSize}
          height={logoSize}
          style={{ objectFit: "contain" }}
        />
      ) : (
        <span
          style={{
            color: "#ffffff",
            fontSize: initialSize,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: layout.initial.length > 1 ? "-0.04em" : undefined,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {layout.initial}
        </span>
      )}
    </div>
  );
}
