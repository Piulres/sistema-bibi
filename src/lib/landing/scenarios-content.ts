/** Cenários validados na POC — não são depoimentos de clientes reais. */
export const VALIDATED_SCENARIOS = [
  {
    id: "techcorp",
    persona: "RH corporativo · cenário demo TechCorp",
    segment: "Saúde",
    quote:
      "Com 500 colaboradores e 15% de uso, o plano fechado custaria ~R$ 175 mil/mês. No Pay Per Use, o mesmo perfil fica em ~R$ 23 mil — auditável no Portal PJ.",
    metric: "~87% economia modelada",
  },
  {
    id: "petcare",
    persona: "Benefício pet · cenário demo PetCare",
    segment: "Veterinária",
    quote:
      "Tutores agendam por pet; o RH paga só consulta, vacina ou banho realizados — sem mensalidade ociosa por tutor elegível.",
    metric: "Pay Per Use por atendimento",
  },
  {
    id: "lex",
    persona: "Assessoria jurídica · cenário demo Lex & Partners",
    segment: "Jurídico",
    quote:
      "Cada hora técnica gera Price Snapshot de R$ 500 — o cliente corporativo vê consumo por área sem disputa de honorários.",
    metric: "Hora auditável em tempo real",
  },
] as const;
