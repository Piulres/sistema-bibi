import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  brandMarkFromBranding,
  brandMarkInitial,
  brandMarkMeshBackground,
  resolveBrandMarkLayout,
  type BrandMarkInput,
  type BrandMarkSize,
} from "@/lib/brand/brand-mark";
import type { BrandingTokens } from "@/lib/theme/tokens";

const SIZE_CLASS: Record<Exclude<BrandMarkSize, "pwa">, string> = {
  xs: "h-6 w-6 text-[11px] rounded-md",
  sm: "h-9 w-9 text-base rounded-lg",
  md: "h-10 w-10 text-lg rounded-lg",
  lg: "h-16 w-16 text-3xl rounded-xl",
  xl: "h-24 w-24 text-5xl rounded-2xl",
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
 * Marca da identidade — gradiente Energia Brasileira whitelabel e inicial ou logo central.
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
            heroFrom: "#1e293b",
            heroTo: "#f59e0b",
          }
        : null);

  if (!resolvedInput) return null;

  const layout = resolveBrandMarkLayout(resolvedInput, 100);
  const initial = brandMarkInitial(resolvedInput.displayName);
  const label = title ?? resolvedInput.displayName;

  const backgroundStyle = useThemeColors
    ? {
        background: [
          "radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in srgb, var(--brand-accent) 35%, transparent), transparent)",
          "radial-gradient(ellipse 60% 40% at 100% 0%, color-mix(in srgb, var(--brand-primary) 25%, transparent), transparent)",
          "radial-gradient(ellipse 50% 30% at 0% 100%, color-mix(in srgb, var(--brand-accent) 15%, transparent), transparent)",
          "linear-gradient(to bottom right, var(--brand-hero-from), var(--brand-hero-to))",
        ].join(", "),
      }
    : { background: brandMarkMeshBackground(layout) };

  const showLogo = Boolean(resolvedInput.logoUrl);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden shadow-sm",
        SIZE_CLASS[size],
        className,
      )}
      style={backgroundStyle}
      title={label}
      aria-hidden={!title}
      role={title ? "img" : undefined}
      aria-label={title ? label : undefined}
    >
      {showLogo ? (
        <span className="flex h-[56%] w-[56%] items-center justify-center overflow-hidden rounded-full bg-white/95 shadow-sm">
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
        <span className="font-bold leading-none text-white drop-shadow-sm">{initial}</span>
      )}
    </span>
  );
}
