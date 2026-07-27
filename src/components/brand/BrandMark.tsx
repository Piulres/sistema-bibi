import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  brandMarkFromBranding,
  brandMarkInitial,
  resolveBrandMarkLayout,
  type BrandMarkInput,
  type BrandMarkSize,
} from "@/lib/brand/brand-mark";
import type { BrandingTokens } from "@/lib/theme/tokens";

const SIZE_CLASS: Record<Exclude<BrandMarkSize, "pwa">, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-9 w-9 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-16 w-16 text-2xl",
  xl: "h-24 w-24 text-4xl",
};

type Props = {
  displayName?: string;
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
 * Marca circular da identidade — círculo com gradiente whitelabel e inicial ou logo.
 * Usada em headers, login, PWA preview e qualquer ponto que precise do ícone de marca.
 */
export default function BrandMark({
  displayName,
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
            logoUrl,
            primaryColor: "#1e293b",
            accentColor: "#f97316",
            heroTo: "#f59e0b",
          }
        : null);

  if (!resolvedInput) return null;

  const layout = useThemeColors ? null : resolveBrandMarkLayout(resolvedInput, 100);
  const initial = brandMarkInitial(resolvedInput.displayName);
  const label = title ?? resolvedInput.displayName;

  const frameStyle = useThemeColors
    ? { backgroundColor: "#0a1018" as const }
    : { backgroundColor: layout!.frameColor };
  const canvasStyle = useThemeColors
    ? { backgroundColor: "var(--brand-primary)" as const }
    : { backgroundColor: layout!.canvasColor };
  const discStyle = useThemeColors
    ? {
        background:
          "linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-hero-to) 100%)" as const,
      }
    : {
        background: `linear-gradient(135deg, ${layout!.gradientFrom} 0%, ${layout!.gradientTo} 100%)`,
      };

  const showLogo = Boolean(resolvedInput.logoUrl);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden shadow-sm",
        SIZE_CLASS[size],
        className,
      )}
      style={frameStyle}
      title={label}
      aria-hidden={!title}
      role={title ? "img" : undefined}
      aria-label={title ? label : undefined}
    >
      <span className="absolute inset-[6.25%]" style={canvasStyle} aria-hidden />
      <span
        className="absolute flex items-center justify-center rounded-full"
        style={{
          width: "70.4%",
          height: "70.4%",
          top: "17%",
          left: "14.8%",
          ...discStyle,
        }}
        aria-hidden
      >
        {showLogo ? (
          <span className="flex h-[78%] w-[78%] items-center justify-center overflow-hidden rounded-full bg-white/95">
            <Image
              src={resolvedInput.logoUrl!}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-contain p-0.5"
              unoptimized={resolvedInput.logoUrl!.startsWith("/api/")}
            />
          </span>
        ) : (
          <span className="font-bold leading-none text-white">{initial}</span>
        )}
      </span>
    </span>
  );
}
