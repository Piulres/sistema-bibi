import { getSiteUrl } from "@/lib/landing/site-url";
import { buildLandingDescription } from "@/lib/landing/content";
import { PLATFORM } from "@/lib/platform";
import type { BrandingTokens } from "@/lib/theme/tokens";

type Props = {
  branding: BrandingTokens;
};

export default function LandingJsonLd({ branding }: Props) {
  const siteUrl = getSiteUrl();
  const description = buildLandingDescription(branding.tagline);

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: branding.displayName,
    description,
    url: siteUrl,
    ...(branding.logoUrl ? { logo: branding.logoUrl } : {}),
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: branding.displayName,
    applicationCategory: PLATFORM.applicationCategory,
    operatingSystem: "Web",
    description,
    url: siteUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
      description: "Demonstração POC — entre em contato para planos corporativos.",
    },
    featureList: [
      "Pay Per Use multi-nicho",
      "Precificação dinâmica B2B",
      "Quatro portais integrados",
      "White label por tenant",
      "Vocabulário adaptável por segmento",
      "Conformidade LGPD",
    ],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `O que é Pay Per Use no ${PLATFORM.shortName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Modelo em que o beneficiário paga somente pelos serviços efetivamente utilizados, com valor transparente e preço congelado no atendimento.",
        },
      },
      {
        "@type": "Question",
        name: "A plataforma suporta múltiplos segmentos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim. O ServiceOS v2.0 adapta vocabulário e identidade por segmento — saúde, veterinária, odontologia, jurídico, bem-estar e educação — com Portal PJ para gestores corporativos.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
    </>
  );
}
