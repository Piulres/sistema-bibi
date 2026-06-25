"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type LogoSize = "sm" | "md";

type Props = {
  displayName: string;
  logoUrl?: string | null;
  logoSize?: LogoSize;
  showTitle?: boolean;
  titleClassName?: string;
  className?: string;
  children?: React.ReactNode;
};

const LOGO_BOX: Record<LogoSize, string> = {
  sm: "h-9 w-9 rounded-lg text-sm",
  md: "h-10 w-10 rounded-xl text-sm",
};

const LOGO_IMAGE: Record<LogoSize, string> = {
  sm: "h-9 w-9 rounded-lg",
  md: "h-10 w-10 rounded-xl",
};

/**
 * Marca clicável — sempre leva à home (`/`).
 * Se já estiver na home, rola suavemente ao topo.
 */
export default function HomeBrandLink({
  displayName,
  logoUrl,
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
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={logoSize === "sm" ? 36 : 40}
          height={logoSize === "sm" ? 36 : 40}
          className={cn("shrink-0 object-contain", LOGO_IMAGE[logoSize])}
          priority={logoSize === "md"}
        />
      ) : (
        <span
          className={cn(
            "ds-logo-mark flex shrink-0 items-center justify-center font-bold text-[var(--text-inverse)] shadow-sm",
            LOGO_BOX[logoSize],
          )}
          aria-hidden
        >
          {displayName.charAt(0)}
        </span>
      )}
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
