import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/landing/site-url";
import { SEGMENT_LANDING_PAGES } from "@/lib/platform/structure";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/venda", priority: 0.8, changeFrequency: "monthly" },
    { path: "/plataforma", priority: 0.7, changeFrequency: "monthly" },
    { path: "/login", priority: 0.5, changeFrequency: "monthly" },
    { path: "/interno/login", priority: 0.5, changeFrequency: "monthly" },
    { path: "/pj/login", priority: 0.5, changeFrequency: "monthly" },
    { path: "/beneficiario/login", priority: 0.5, changeFrequency: "monthly" },
  ];

  const segmentRoutes = SEGMENT_LANDING_PAGES.map((page) => ({
    path: page.href,
    priority: 0.9,
    changeFrequency: "weekly" as const,
  }));

  return [...staticRoutes, ...segmentRoutes].map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
