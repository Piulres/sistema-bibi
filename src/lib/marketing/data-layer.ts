import type { UtmParams } from "@/lib/marketing/utm";

export type DataLayerEvent =
  | {
      event: "page_view_enriched";
      page_path: string;
      page_title?: string;
      utm?: UtmParams;
    }
  | {
      event: "cta_whatsapp_click";
      cta_location: string;
      page_path: string;
      utm?: UtmParams;
    }
  | {
      event: "cta_demo_click";
      cta_location: string;
      page_path: string;
    }
  | {
      event: "cta_portals_click";
      cta_location: string;
      page_path: string;
    }
  | {
      event: "segment_landing_view";
      segment_slug: string;
      niche: string;
      utm?: UtmParams;
    }
  | {
      event: "roi_calculator_change";
      segment: string;
      eligible: number;
      utilization_pct: number;
      savings_pct: number;
      page_path: string;
    }
  | {
      event: "lead_form_submit";
      segment: string;
      page_path: string;
      utm?: UtmParams;
    };

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Empurra evento tipado para o dataLayer (GTM). No-op fora do browser. */
export function pushDataLayer(payload: DataLayerEvent): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload as unknown as Record<string, unknown>);
}
