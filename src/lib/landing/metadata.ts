import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/landing/site-url";

export const DEFAULT_OG_IMAGE_PATH = "/og/serviceos-default.png";

type LandingMetadataInput = {
  title: string;
  description: string;
  canonicalPath: string;
  keywords?: string[];
  ogImagePath?: string;
};

/** Metadados enriquecidos para landings públicas (OG + Twitter). */
export function buildLandingMetadata({
  title,
  description,
  canonicalPath,
  keywords = [],
  ogImagePath = DEFAULT_OG_IMAGE_PATH,
}: LandingMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
  const ogImageUrl = `${siteUrl}${ogImagePath}`;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical },
    keywords,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: `${siteUrl}${canonical}`,
      siteName: title.split(" — ")[0] ?? title,
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}
