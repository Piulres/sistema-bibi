"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandMark from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils/cn";

type LogoSize = "sm" | "md";

type Props = {
  displayName: string;
  logoUrl?: string | null;
  primaryColor?: string;
  accentColor?: string;
  heroTo?: string;
  /** Herda cores do TenantTheme quando cores explícitas não são passadas. */
  useThemeColors?: boolean;
  logoSize?: LogoSize;
  showTitle?: boolean;
  titleClassName?: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Marca clicável — sempre leva à home (`/`).
 * Se já estiver na home, rola suavemente ao topo.
 */
export default function HomeBrandLink({
  displayName,
  logoUrl,
  primaryColor,
  accentColor,
  heroTo,
  useThemeColors,
  logoSize = "md",
  showTitle = true,
  titleClassName,
  className,
  children,
}: Props) {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const hasExplicitColors = Boolean(primaryColor && accentColor);
  const themeMode = useThemeColors ?? !hasExplicitColors;

  return (
    <Link
      href="/"
      onClick={handleClick}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-md text-left transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2",
        className,
      )}
      aria-label={`${displayName} — início do site`}
    >
      <BrandMark
        displayName={displayName}
        logoUrl={logoUrl}
        useThemeColors={themeMode}
        input={
          hasExplicitColors
            ? {
                displayName,
                logoUrl,
                primaryColor: primaryColor!,
                accentColor: accentColor!,
                heroTo,
              }
            : undefined
        }
        size={logoSize}
      />
      {(showTitle || children) && (
        <div className="min-w-0">
          {showTitle && (
            <span
              className={cn(
                "block truncate font-semibold tracking-tight text-[var(--text-primary)]",
                logoSize === "sm" ? "text-sm" : "text-base",
                titleClassName,
              )}
            >
              {displayName}
            </span>
          )}
          {children}
        </div>
      )}
    </Link>
  );
}
