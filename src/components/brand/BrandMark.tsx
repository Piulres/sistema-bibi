import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  brandMarkFromBranding,
  brandMarkFontSizePx,
  brandMarkMeshStyle,
  brandMarkThemeMeshStyle,
  BRAND_MARK_SIZE_PX,
  resolveBrandMarkLayout,
  type BrandMarkInput,
  type BrandMarkSize,
} from "@/lib/brand/brand-mark";
import type { BrandingTokens } from "@/lib/theme/tokens";

const SIZE_CLASS: Record<Exclude<BrandMarkSize, "pwa">, string> = {
  xs: "h-6 w-6 text-[11px] rounded-full",
  sm: "h-9 w-9 text-base rounded-full",
  md: "h-10 w-10 text-lg rounded-full",
  lg: "h-16 w-16 text-3xl rounded-full",
  xl: "h-24 w-24 text-5xl rounded-full",
};

type Props = {
  displayName?: string;
  markText?: string | null;
  logoUrl?: string | null;
  branding?: BrandingTokens;
  input?: BrandMarkInput;
  /** Herda --brand-* do TenantTheme (portais e login). */
  useThemeColors?: boolean;
  size?: Exclude<BrandMarkSize, "pwa">;
  className?: string;
  title?: string;
};

/**
 * Marca da identidade — gradiente Energia Brasileira whitelabel e inicial ou logo central.
 * Usada em headers, login, PWA preview e qualquer ponto que precise do ícone de marca.
 */
export default function BrandMark({
  displayName,
  markText,
  logoUrl,
  branding,
  input,
  useThemeColors = false,
  size = "md",
  className,
  title,
}: Props) {
  const resolvedInput =
    input ??
    (branding
      ? brandMarkFromBranding(branding)
      : displayName
        ? {
            displayName,
            markText,
            logoUrl,
            primaryColor: "#1e293b",
            accentColor: "#f97316",
            heroFrom: "#1e293b",
            heroTo: "#f59e0b",
          }
        : null);

  if (!resolvedInput) return null;

  const layout = resolveBrandMarkLayout(resolvedInput, 100);
  const markLabel = layout.initial;
  const label = title ?? resolvedInput.displayName;
  const boxPx = BRAND_MARK_SIZE_PX[size];
  const fontSizePx = brandMarkFontSizePx(boxPx, markLabel);

  const meshStyle = useThemeColors ? brandMarkThemeMeshStyle() : brandMarkMeshStyle(layout);

  const showLogo = Boolean(resolvedInput.logoUrl);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        SIZE_CLASS[size],
        className,
      )}
      style={{
        width: boxPx,
        height: boxPx,
        minWidth: boxPx,
        minHeight: boxPx,
        backgroundColor: meshStyle.backgroundColor,
        backgroundImage: meshStyle.backgroundImage,
      }}
      title={label}
      aria-hidden={!title}
      role={title ? "img" : undefined}
      aria-label={title ? label : undefined}
    >
      {showLogo ? (
        <Image
          src={resolvedInput.logoUrl!}
          alt=""
          width={64}
          height={64}
          className="h-[62%] w-[62%] object-contain"
          unoptimized={resolvedInput.logoUrl!.startsWith("/api/")}
        />
      ) : (
        <span
          className="font-bold leading-none tracking-tight text-white"
          style={{ fontSize: fontSizePx }}
        >
          {markLabel}
        </span>
      )}
    </span>
  );
}
