"use client";

import { Suspense, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getSalesWhatsAppConfig,
  buildWhatsAppUrl,
} from "@/lib/landing/whatsapp";
import {
  buildWhatsAppMessage,
  hasUtmParams,
  mergeUtm,
  parseUtmParams,
  readStoredUtm,
} from "@/lib/marketing/utm";
import { pushDataLayer } from "@/lib/marketing/data-layer";
import LandingIcon from "@/components/landing/LandingIcon";
import {
  landingCtaClasses,
  type LandingCtaSize,
  type LandingCtaVariant,
} from "@/components/landing/landing-cta";

type Props = {
  variant: LandingCtaVariant;
  size?: LandingCtaSize;
  location: string;
  className?: string;
  label?: string;
};

export default function LandingWhatsAppCta(props: Props) {
  return (
    <Suspense fallback={null}>
      <LandingWhatsAppCtaInner {...props} />
    </Suspense>
  );
}

function LandingWhatsAppCtaInner({
  variant,
  size = "lg",
  location,
  className,
  label = "Fale com um especialista",
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const config = getSalesWhatsAppConfig();

  const utm = useMemo(() => {
    const incoming = parseUtmParams(searchParams);
    const stored = readStoredUtm();
    return hasUtmParams(incoming) ? mergeUtm(stored, incoming) : stored;
  }, [searchParams]);

  const href = useMemo(() => {
    if (!config) return null;
    const message = buildWhatsAppMessage(config.defaultMessage, utm);
    return buildWhatsAppUrl(config.number, message);
  }, [config, utm]);

  if (!config || !href) return null;

  function handleClick() {
    pushDataLayer({
      event: "cta_whatsapp_click",
      cta_location: location,
      page_path: pathname,
      utm: Object.keys(utm).length > 0 ? utm : undefined,
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={`${label} pelo WhatsApp (abre em nova aba)`}
      className={landingCtaClasses(variant, size, className)}
    >
      <LandingIcon name="message" className="h-5 w-5 shrink-0" />
      {label}
    </a>
  );
}
