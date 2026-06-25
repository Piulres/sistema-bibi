"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { readStoredUtm } from "@/lib/marketing/utm";
import { pushDataLayer } from "@/lib/marketing/data-layer";
import { isMarketingActive } from "@/lib/marketing/config";

type Props = {
  segmentSlug: string;
  niche: string;
};

export default function SegmentLandingTracker({ segmentSlug, niche }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!isMarketingActive()) return;

    const utm = readStoredUtm();
    pushDataLayer({
      event: "segment_landing_view",
      segment_slug: segmentSlug,
      niche,
      utm: Object.keys(utm).length > 0 ? utm : undefined,
    });
  }, [segmentSlug, niche, pathname]);

  return null;
}
