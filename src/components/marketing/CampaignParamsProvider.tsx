"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  hasUtmParams,
  mergeUtm,
  parseUtmParams,
  readStoredUtm,
  storeUtm,
} from "@/lib/marketing/utm";
import { pushDataLayer } from "@/lib/marketing/data-layer";
import { isMarketingActive } from "@/lib/marketing/config";

/** Captura UTM da URL, persiste na sessão e enriquece o dataLayer. */
export default function CampaignParamsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isMarketingActive()) return;

    const incoming = parseUtmParams(searchParams);
    const stored = readStoredUtm();
    const merged = hasUtmParams(incoming) ? mergeUtm(stored, incoming) : stored;

    if (hasUtmParams(incoming)) {
      storeUtm(merged);
    }

    pushDataLayer({
      event: "page_view_enriched",
      page_path: pathname,
      utm: hasUtmParams(merged) ? merged : undefined,
    });
  }, [pathname, searchParams]);

  return null;
}
