import type { LandingChangelogContent } from "@/lib/landing/types";

/**
 * Conteúdo da seção #novidades na home.
 * Atualizar ao fechar cada pacote — ver docs/plataforma/LANDING_CHANGELOG.md
 * e docs/versoes/RELEASES.md.
 */
export const landingChangelog: LandingChangelogContent = {
  eyebrow: "Novidades",
  title: "O que há de novo no Sistema Bibi",
  subtitle:
    "Pacotes fechados do ServiceOS — do multi-segmento ao núcleo clínico CEDIG com pontes Pay Per Use.",
  currentRelease: {
    version: "2.6.0",
    dateLabel: "Julho 2026",
    badge: "Pronto para produção",
    summary:
      "CEDIG ponta a ponta (fase 2+F): gestão clínica → Patient/Appointment/PPU, export financeiro, labels, PJ×3 e E2E. Empilha o login tenant/portal da v2.5.0.",
    highlights: [
      {
        title: "Ponte clínica → Pay Per Use",
        description:
          "ClinicExamLaunch vira Patient + Appointment REALIZADO + ProcedureUsage + Invoice (e Payment quando não é convênio), com FKs rastreáveis.",
      },
      {
        title: "Export financeiro CEDIG",
        description:
          "CSV por competência no portal interno — lançamentos, exames e totais alinhados à clínica.",
      },
      {
        title: "White-label + PJ CEDIG",
        description:
          "Labels CLINIC_* no dicionário, três empresas demo (CentralMed, Bem Saúde, Dr Saúde) e E2E da ponte no CI.",
      },
      {
        title: "Login com tenant e portal (v2.5)",
        description:
          "Campo de tenant digitável, seletor de portal e validação de acesso — base empilhada neste pacote.",
      },
    ],
  },
  previousReleases: [
    {
      version: "2.5.0",
      title: "Login com tenant e seletor de portal",
      summary:
        "Campo de tenant digitável, seletor de portal e validação de acesso — base da v2.6.",
    },
    {
      version: "2.4.0",
      title: "Núcleo clínico CEDIG",
      summary:
        "Módulo clínico no Interno: pacientes, agenda, prontuário, financeiro e convênios — sem faturamento PPU.",
    },
    {
      version: "2.3.0",
      title: "Dual-store e operação limpa",
      summary:
        "Seletor demo/operação, operation.db sem massa fictícia e bootstrap CEDIG na clínica.",
    },
    {
      version: "2.2.0",
      title: "White-label e multi-tenant",
      summary:
        "Landing por segmento, login com escopo de tenant e isolamento de dados por clínica.",
    },
    {
      version: "2.1.0",
      title: "ServiceOS multi-segmento",
      summary:
        "Pay Per Use horizontal, seis nichos e quatro portais com labels por tenant.",
    },
  ],
  cta: {
    label: "Ver documentação de releases",
    href: "https://github.com/Piulres/sistema-bibi/blob/main/docs/versoes/RELEASES.md",
  },
};
