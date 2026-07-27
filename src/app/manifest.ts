import type { MetadataRoute } from "next";
import { PLATFORM } from "@/lib/platform";

/** Web App Manifest — ServiceOS v3.0 (PWA standalone). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PLATFORM.name,
    short_name: PLATFORM.shortName,
    description: PLATFORM.tagline,
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0f172a",
    theme_color: "#f97316",
    lang: "pt-BR",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
