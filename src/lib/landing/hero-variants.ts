import type { RoiSegmentKey } from "@/lib/landing/roi-calculator";
import { parseRoiSegmentKey } from "@/lib/landing/roi-calculator";
import { HOME_HERO } from "@/lib/landing/home-content";

export type HomeHeroVariant = {
  segment: RoiSegmentKey | "default";
  badge?: string;
  headline: string;
  headlineAccent: string;
  description: string;
  roiDetail?: string;
};

const SEGMENT_HERO: Record<RoiSegmentKey, Omit<HomeHeroVariant, "segment">> = {
  MEDICAL: {
    badge: "Saúde corporativa · Pay Per Use",
    headline: "Pare de pagar por 500 vidas.",
    headlineAccent: "Pague só pelas consultas realizadas.",
    description:
      "O RH audita cada consulta no Portal PJ — preço congelado no atendimento, sem caixa preta de sinistralidade.",
    roiDetail: "Cenário referência: 500 colaboradores, 15% de utilização",
  },
  VET: {
    badge: "Auxílio pet · Pay Per Use",
    headline: "Benefício pet sem mensalidade ociosa.",
    headlineAccent: "Cobre só banho, consulta ou vacina usados.",
    description:
      "Tutores agendam para cada pet; o RH vê cada atendimento faturado com transparência total.",
    roiDetail: "Alternativa a plano pet fixo por tutor elegível",
  },
  DENTAL: {
    badge: "Odonto corporativo · Pay Per Use",
    headline: "Odonto table stakes,",
    headlineAccent: "sem pagar por quem não vai ao dentista.",
    description:
      "Cada limpeza ou consulta odontológica gera registro auditável — preço travado no procedimento.",
    roiDetail: "Economia em baixa utilização vs. plano mensal por vida",
  },
  LEGAL: {
    badge: "Hora técnica · Pay Per Use",
    headline: "Pare de perder receita",
    headlineAccent: "em horas não faturadas.",
    description:
      "Cada atendimento jurídico gera Price Snapshot — cliente corporativo audita consumo em tempo real.",
    roiDetail: "Substitui retainer opaco por uso real registrado",
  },
  SPA: {
    badge: "Wellness corporativo · Pay Per Use",
    headline: "Wellness sem assinatura ociosa.",
    headlineAccent: "Pague só pelas sessões agendadas.",
    description:
      "Massagem, yoga ou drenagem faturadas por uso — alternativa transparente a pacotes Wellhub/Gympass.",
    roiDetail: "RH vê cada sessão no Portal PJ",
  },
  EDUCATION: {
    badge: "L&D · Pay Per Use",
    headline: "Crédito educacional real,",
    headlineAccent: "não licença de plataforma ociosa.",
    description:
      "Cada aula ou mentoria registrada é faturável e auditável — upskilling mensurável para o RH.",
    roiDetail: "Alternativa a Udemy/Alura com baixa conclusão",
  },
};

export function resolveHomeHeroVariant(
  segmentParam: string | null | undefined,
): HomeHeroVariant {
  const key = parseRoiSegmentKey(segmentParam);
  if (!key) {
    return {
      segment: "default",
      headline: HOME_HERO.headline,
      headlineAccent: HOME_HERO.headlineAccent,
      description: HOME_HERO.description,
      roiDetail: HOME_HERO.roiDetail,
    };
  }

  const variant = SEGMENT_HERO[key];
  return { segment: key, ...variant };
}

/** Query params aceitos: `utm_segment`, `segment`. */
export function readHeroSegmentParam(
  params: URLSearchParams | ReadonlyURLSearchParams,
): string | null {
  return params.get("utm_segment") ?? params.get("segment");
}

type ReadonlyURLSearchParams = Pick<URLSearchParams, "get">;
