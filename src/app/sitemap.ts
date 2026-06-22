import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/landing/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const publicRoutes = [
    "",
    "/login",
    "/interno/login",
    "/pj/login",
    "/beneficiario/login",
  ] as const;

  return publicRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
