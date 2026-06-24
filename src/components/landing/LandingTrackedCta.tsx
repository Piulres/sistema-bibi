"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { pushDataLayer } from "@/lib/marketing/data-layer";
import { isMarketingActive } from "@/lib/marketing/config";
import {
  landingCtaClasses,
  type LandingCtaSize,
  type LandingCtaVariant,
} from "@/components/landing/landing-cta";

type Props = {
  href: string;
  event: "cta_demo_click" | "cta_portals_click";
  location: string;
  variant: LandingCtaVariant;
  size?: LandingCtaSize;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
};

export default function LandingTrackedCta({
  href,
  event,
  location,
  variant,
  size = "lg",
  className,
  children,
  external = false,
}: Props) {
  const pathname = usePathname();

  function handleClick() {
    if (!isMarketingActive()) return;
    pushDataLayer({
      event,
      cta_location: location,
      page_path: pathname,
    });
  }

  const classNames = landingCtaClasses(variant, size, className);

  if (external || href.startsWith("http") || href.startsWith("#")) {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={classNames}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={handleClick} className={classNames}>
      {children}
    </Link>
  );
}
