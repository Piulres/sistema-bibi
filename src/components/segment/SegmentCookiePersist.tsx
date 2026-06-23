"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/** Sincroniza `?tenant=` / `?niche=` da URL com o cookie assinado via API. */
export default function SegmentCookiePersist() {
  const searchParams = useSearchParams();
  const synced = useRef<string | null>(null);

  useEffect(() => {
    const tenant = searchParams.get("tenant");
    const niche = searchParams.get("niche");
    const key = `${tenant ?? ""}|${niche ?? ""}`;
    if (synced.current === key) return;
    synced.current = key;

    void fetch("/api/segment/persist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant, niche }),
    });
  }, [searchParams]);

  return null;
}
