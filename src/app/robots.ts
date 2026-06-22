import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/landing/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/prestador/",
        "/interno/dashboard",
        "/interno/agenda",
        "/interno/cadastros",
        "/interno/crm",
        "/interno/relatorios",
        "/interno/comunicacao",
        "/interno/assinaturas",
        "/interno/integracoes",
        "/interno/branding",
        "/interno/seguranca",
        "/interno/beneficiarios/",
        "/pj/",
        "/beneficiario/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
