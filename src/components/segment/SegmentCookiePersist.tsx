"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { NicheId } from "@/lib/niche/types";

type Props = {
  tenantSlug?: string | null;
  niche?: NicheId | null;
};

/** Sincroniza segmento da URL ou props com o cookie assinado via API. */
export default function SegmentCookiePersist({ tenantSlug, niche }: Props = {}) {
  const searchParams = useSearchParams();
  const synced = useRef<string | null>(null);

  useEffect(() => {
    const tenant = searchParams.get("tenant") ?? tenantSlug ?? null;
    const resolvedNiche = searchParams.get("niche") ?? niche ?? null;
    const key = `${tenant ?? ""}|${resolvedNiche ?? ""}`;
    if (synced.current === key) return;
    synced.current = key;

    void fetch("/api/segment/persist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant, niche: resolvedNiche }),
    });
  }, [searchParams, tenantSlug, niche]);

  return null;
}
