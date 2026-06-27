import type { RoiSegmentKey } from "@/lib/landing/roi-calculator";

/** Comparativo homepage — ServiceOS vs modelo tradicional vs referência de mercado. */
export type CompareRow = {
  criterion: string;
  serviceos: string;
  traditional: string;
  market: string;
};

export const HOME_COMPARE_INTRO = {
  title: "Por que não um plano fechado ou assinatura?",
  description:
    "Comparativo estratégico — referências de mercado (Conexa, Wellhub, operadoras) são modeladas, não auditoria independente.",
} as const;

export const HOME_COMPARE_ROWS: CompareRow[] = [
  {
    criterion: "Modelo de cobrança",
    serviceos: "Pay Per Use — só o utilizado",
    traditional: "Mensalidade por elegível",
    market: "Assinatura por vida ou acesso",
  },
  {
    criterion: "Transparência para RH",
    serviceos: "Portal PJ — item a item",
    traditional: "Caixa preta / sinistralidade",
    market: "Dashboard parcial ou inexistente",
  },
  {
    criterion: "Preço no atendimento",
    serviceos: "Price Snapshot congelado",
    traditional: "Reajuste anual opaco",
    market: "Tabela ou coparticipação variável",
  },
  {
    criterion: "Multi-segmento",
    serviceos: "6 nichos, mesma infraestrutura",
    traditional: "Um produto por vertical",
    market: "Especialista em um nicho",
  },
  {
    criterion: "White label",
    serviceos: "Marca do cliente por tenant",
    traditional: "Logo do fornecedor",
    market: "Depende do plano",
  },
  {
    criterion: "API e integrações",
    serviceos: "REST + webhooks documentados",
    traditional: "Fechado ou limitado",
    market: "Variável por player",
  },
];

export const HOME_COMPARE_FOOTNOTES = [
  "Saúde: referência Conexa a partir de R$ 19,90/vida (PME) — plano por elegibilidade.",
  "Wellness: Wellhub estimado R$ 35–70/colaborador/mês — acesso, não sessão auditável.",
  "Detalhes por nicho: docs/comercial/BENCHMARKS_POR_NICHO.md",
] as const;

/** Rótulo da coluna "mercado" por segmento (campanha UTM). */
export const COMPARE_MARKET_LABEL_BY_SEGMENT: Record<RoiSegmentKey, string> = {
  MEDICAL: "Conexa / operadoras",
  VET: "Guapeco / plano pet",
  DENTAL: "Odontoprev / Clinicorp",
  LEGAL: "Astrea / ADVBox",
  SPA: "Wellhub / Buddha Spa",
  EDUCATION: "Udemy Business / Hotmart",
};

export function compareIntroForSegment(segment: RoiSegmentKey | null) {
  if (!segment) return HOME_COMPARE_INTRO;
  const market = COMPARE_MARKET_LABEL_BY_SEGMENT[segment];
  return {
    title: HOME_COMPARE_INTRO.title,
    description: `${HOME_COMPARE_INTRO.description} Referência desta campanha: ${market}.`,
  };
}
