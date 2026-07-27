import type { BrandMarkInput } from "@/lib/brand/brand-mark";
import {
  brandMarkFontSizePx,
  brandMarkMeshStyle,
  resolveBrandMarkLayout,
} from "@/lib/brand/brand-mark";

type OgBrandMarkProps = {
  input: BrandMarkInput;
  size: number;
  /** Padding relativo para ícones maskable (ex.: 0.12 = 12% de margem). */
  insetRatio?: number;
};

/** JSX para ImageResponse (icon.tsx, apple-icon, script de PNG). */
export function OgBrandMark({ input, size, insetRatio = 0 }: OgBrandMarkProps) {
  const layout = resolveBrandMarkLayout(input, size);
  const inset = Math.max(0, Math.min(insetRatio, 0.2));
  const innerSize = Math.round(size * (1 - inset * 2));
  const meshStyle = brandMarkMeshStyle(layout);
  const logoSize = Math.round(innerSize * 0.58);
  const initialSize = brandMarkFontSizePx(innerSize, layout.initial);

  const mark = (
    <div
      style={{
        width: innerSize,
        height: innerSize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        overflow: "hidden",
        backgroundColor: meshStyle.backgroundColor,
        backgroundImage: meshStyle.backgroundImage,
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
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: layout.initial.length > 1 ? "-0.05em" : undefined,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {layout.initial}
        </span>
      )}
    </div>
  );

  if (inset <= 0) return mark;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: meshStyle.backgroundColor,
      }}
    >
      {mark}
    </div>
  );
}
