import type { NicheId, NicheLabels } from "@/lib/niche/types";
import type { InternoModule } from "@/lib/interno-permissions";
import {
  buildBeneficiarioNavTabs,
  buildInternoNavTabs,
  buildPrestadorNavTabs,
} from "@/lib/navigation/niche-nav";
import type { OnboardingStep } from "./types";
import { TOUR } from "./targets";

type StepInput = Omit<OnboardingStep, "id"> & { id: string };

function step(s: StepInput): OnboardingStep {
  return s;
}

function navLabelsSummary(
  tabs: { label: string }[],
): string {
  return tabs.map((t) => `• ${t.label}`).join("\n");
}

/** Features do portal interno — nav condensado + micro-tours por rota. */
export function buildInternoFeatures(labels: NicheLabels, niche: NicheId = "MEDICAL"): OnboardingStep[] {
  const p = labels.patients.toLowerCase();
  const b = labels.beneficiaries.toLowerCase();
  const pr = labels.providers.toLowerCase();
  const proc = labels.procedures.toLowerCase();
  const appt = labels.appointments.toLowerCase();

  return [
    step({
      id: "welcome",
      target: TOUR.header,
      title: "Bem-vindo ao portal interno",
      content:
        "Centro de operação do tenant: faturamento Pay Per Use, agenda, cadastros, CRM, recorrência, comunicação e configurações.",
      placement: "bottom",
      order: 0,
    }),
    step({
      id: "nav-overview",
      target: TOUR.nav,
      title: "Navegação",
      content:
        "No desktop, use as abas abaixo. No celular, toque em «Módulos» para abrir o menu lateral com todos os módulos.",
      placement: "bottom",
      order: 10,
    }),
    step({
      id: "nav-modules",
      target: TOUR.nav,
      title: "Módulos de operação",
      content: `Cada aba cobre um fluxo do tenant. Ao entrar em um módulo pela primeira vez, um tour curto destaca as ações principais.\n\n${navLabelsSummary(buildInternoNavTabs(labels, niche))}`,
      placement: "bottom",
      order: 20,
    }),

    // —— Micro-tours: detalhe por rota ——
    step({
      id: "page-dashboard",
      target: TOUR.content,
      title: "Painel executivo",
      content:
        "Acompanhe receita Pay Per Use, MRR, atendimentos do dia, top pendências e timeline de atividade recente.",
      placement: "top",
      route: "/interno/dashboard",
      module: "dashboard",
      order: 100,
    }),
    step({
      id: "page-billing-cliente360",
      target: TOUR.hotspot("billing-cliente-360"),
      title: "Cliente 360°",
      content: `Abra a visão consolidada do ${labels.beneficiary.toLowerCase()}: consumo, faturas, timeline e exportação LGPD.`,
      placement: "left",
      route: "/interno",
      module: "billing",
      order: 100,
    }),
    step({
      id: "page-billing",
      target: TOUR.hotspot("billing-pending"),
      title: "Procedimentos a faturar",
      content:
        `Agrupe ${proc} pendentes por ${labels.beneficiary.toLowerCase()}, acesse o Cliente 360° e clique em «Gerar fatura».`,
      placement: "top",
      route: "/interno",
      module: "billing",
      order: 100,
    }),
    step({
      id: "page-billing-invoices",
      target: TOUR.content,
      title: "Faturas emitidas",
      content: "Confirme PIX, exporte PDF/XLSX, gere XML TISS e marque faturas como pagas.",
      placement: "top",
      route: "/interno",
      module: "billing",
      order: 101,
    }),
    step({
      id: "page-agenda-walkin",
      target: TOUR.hotspot("walk-in-callout"),
      title: "Walk-in particular",
      content:
        `Cadastre e agende ${p} particulares em um passo — ideal para recepção sem agendamento prévio.`,
      placement: "bottom",
      route: "/interno/agenda*",
      module: "agenda",
      order: 100,
    }),
    step({
      id: "page-agenda",
      target: TOUR.content,
      title: `Agenda de ${appt}`,
      content:
        `Novo agendamento com prestador automático, confirmação de chegada, status e link de telemedicina.`,
      placement: "top",
      route: "/interno/agenda*",
      module: "agenda",
      order: 101,
    }),
    step({
      id: "page-cadastros",
      target: TOUR.content,
      title: "Central de cadastros",
      content:
        `Abas por entidade: ${b}, ${pr}, empresas, ${proc}, precificação e protocolos. Use a aba Mapa CRUD para importar JSON/CSV e ver as 27 entidades.`,
      placement: "top",
      route: "/interno/cadastros*",
      module: "cadastros",
      order: 100,
    }),
    step({
      id: "page-cadastros-crud",
      target: TOUR.hotspot("cadastros-crud-map"),
      title: "Mapa CRUD",
      content: "Referência de todas as operações da plataforma com atalhos para telas e APIs.",
      placement: "top",
      route: "/interno/cadastros*",
      module: "cadastros",
      order: 101,
    }),
    step({
      id: "page-estoque",
      target: TOUR.content,
      title: "Estoque clínico",
      content: "Resumo com alertas, catálogo de produtos, lotes FIFO, movimentações e kits por procedimento.",
      placement: "top",
      route: "/interno/estoque*",
      module: "estoque",
      order: 100,
    }),
    step({
      id: "page-crm",
      target: TOUR.content,
      title: "Pipeline CRM",
      content: "Arraste empresas entre colunas de status e acompanhe beneficiários e faturas por parceiro.",
      placement: "top",
      route: "/interno/crm*",
      module: "crm",
      order: 100,
    }),
    step({
      id: "page-subscriptions",
      target: TOUR.content,
      title: "Assinaturas recorrentes",
      content: `Crie planos por ${labels.beneficiary.toLowerCase()}, gere cobranças do ciclo e fature pendências.`,
      placement: "top",
      route: "/interno/assinaturas*",
      module: "subscriptions",
      order: 100,
    }),
    step({
      id: "page-comunicacao",
      target: TOUR.content,
      title: "Central de comunicação",
      content: "Gere lembretes automáticos e despache mensagens da fila (consulta, assinatura, fatura).",
      placement: "top",
      route: "/interno/comunicacao*",
      module: "comunicacao",
      order: 100,
    }),
    step({
      id: "page-relatorios",
      target: TOUR.content,
      title: "Relatórios exportáveis",
      content: "Baixe relatórios de faturamento e CRM nos formatos PDF, XLSX e CSV.",
      placement: "top",
      route: "/interno/relatorios*",
      module: "relatorios",
      order: 100,
    }),
    step({
      id: "page-auditoria",
      target: TOUR.content,
      title: "Trilha de auditoria",
      content: "Filtre por entidade e período, expanda diffs e restaure versões anteriores quando permitido.",
      placement: "top",
      route: "/interno/auditoria*",
      module: "auditoria",
      order: 100,
    }),
    step({
      id: "page-branding",
      target: TOUR.content,
      title: "Identidade white label",
      content: "Aplique presets por nicho, personalize cores e logo, e visualize o resultado em tempo real.",
      placement: "top",
      route: "/interno/branding*",
      module: "branding",
      order: 100,
    }),
    step({
      id: "page-integracoes",
      target: TOUR.content,
      title: "Webhooks B2B",
      content: "Configure endpoints com secret HMAC, escolha eventos e monitore entregas com retry manual.",
      placement: "top",
      route: "/interno/integracoes*",
      module: "integracoes",
      order: 100,
    }),
    step({
      id: "page-seguranca",
      target: TOUR.content,
      title: "Segurança e ambiente",
      content: "Configure MFA TOTP, alterne entre modo demo e operação e restaure dados de demonstração.",
      placement: "top",
      route: "/interno/seguranca*",
      module: "seguranca",
      order: 100,
    }),
    step({
      id: "page-seguranca-datastore",
      target: TOUR.hotspot("data-store-mode"),
      title: "Demo vs operação",
      content: "Alterne entre massa de demonstração e ambiente operacional (dual-store). Somente ADMIN.",
      placement: "top",
      route: "/interno/seguranca*",
      module: "seguranca",
      order: 101,
    }),
    step({
      id: "page-seguranca-reset",
      target: TOUR.hotspot("demo-reset"),
      title: "Restaurar demo",
      content: "Volte ao estado original do seed para apresentações e testes repetíveis.",
      placement: "top",
      route: "/interno/seguranca*",
      module: "seguranca",
      order: 102,
    }),
    step({
      id: "page-projetos",
      target: TOUR.content,
      title: labels.patients,
      content: `Gestão de obras: pipeline, orçamentos, cronograma, BDI, caixa e relatórios financeiros por ${labels.patient.toLowerCase()}.`,
      placement: "top",
      route: "/interno/projetos*",
      module: "projetos",
      order: 100,
    }),
    step({
      id: "page-cliente-360",
      target: TOUR.content,
      title: "Cliente 360°",
      content: `Visão unificada do ${labels.beneficiary.toLowerCase()}: consumo Pay Per Use, faturas, assinaturas, timeline e exportação.`,
      placement: "top",
      route: "/interno/beneficiarios/*",
      module: "cadastros",
      order: 100,
    }),

    step({
      id: "content-fallback",
      target: TOUR.content,
      title: "Área de trabalho",
      content: "O conteúdo do módulo ativo aparece aqui — filtros, tabelas e ações contextuais.",
      placement: "top",
      order: 200,
    }),

    step({
      id: "assistant",
      target: TOUR.assistant,
      title: "Assistente inteligente",
      content:
        "Converse com o assistente sobre a página atual — agendamentos, faturamento, cadastros e navegação.",
      placement: "left",
      order: 900,
    }),
  ];
}

export function buildPrestadorFeatures(labels: NicheLabels, niche: NicheId = "MEDICAL"): OnboardingStep[] {
  const p = labels.patient.toLowerCase();
  const appt = labels.appointments.toLowerCase();

  return [
    step({
      id: "welcome",
      target: TOUR.header,
      title: `Portal do ${labels.provider}`,
      content: `Central de ${appt}, prontuário eletrônico (PEP), procedimentos Pay Per Use e extrato financeiro.`,
      placement: "bottom",
      order: 0,
    }),
    step({
      id: "nav-overview",
      target: TOUR.nav,
      title: "Navegação",
      content: "No celular, toque no menu «Módulos» para ver todas as abas. Ao visitar cada módulo, um tour curto destaca as ações principais.",
      placement: "bottom",
      order: 10,
    }),
    step({
      id: "nav-modules",
      target: TOUR.nav,
      title: "Áreas do portal",
      content: `Fluxos do ${labels.provider.toLowerCase()}:\n\n${navLabelsSummary(buildPrestadorNavTabs(labels, niche))}`,
      placement: "bottom",
      order: 20,
    }),

    step({
      id: "page-dashboard",
      target: TOUR.hotspot("prestador-next-appt"),
      title: "Próximo atendimento",
      content: `Atalho direto para iniciar o atendimento do próximo ${p} na fila do dia.`,
      placement: "bottom",
      route: "/prestador/dashboard",
      order: 100,
    }),
    step({
      id: "page-dashboard-queue",
      target: TOUR.content,
      title: "Fila do dia",
      content: `Lista de ${appt} com status, badge de telemedicina e botão Atender.`,
      placement: "top",
      route: "/prestador/dashboard",
      order: 101,
    }),
    step({
      id: "page-agenda",
      target: TOUR.content,
      title: "Sua agenda",
      content: `Alterne entre Dia, Próximos e Histórico. Confirme presença e abra o atendimento de cada ${p}.`,
      placement: "top",
      route: "/prestador",
      order: 100,
    }),
    step({
      id: "page-pacientes",
      target: TOUR.content,
      title: `Lista de ${labels.patients.toLowerCase()}`,
      content: `Pesquise e acesse histórico clínico, medicações, exames e protocolos de cada ${p}.`,
      placement: "top",
      route: "/prestador/pacientes*",
      order: 100,
    }),
    step({
      id: "page-extrato",
      target: TOUR.content,
      title: "Extrato financeiro",
      content: "Valores por procedimento realizado, totais do período e exportação.",
      placement: "top",
      route: "/prestador/extrato*",
      order: 100,
    }),
    step({
      id: "page-relatorios",
      target: TOUR.content,
      title: "Relatórios",
      content: "Gere relatórios de procedimentos e atendimentos para o período selecionado.",
      placement: "top",
      route: "/prestador/relatorios*",
      order: 100,
    }),
    step({
      id: "page-atendimento",
      target: TOUR.hotspot("atendimento-pep"),
      title: "Prontuário (PEP)",
      content:
        `Registre ${labels.procedures.toLowerCase()} Pay Per Use, anotações clínicas com templates, medicações, exames, materiais de estoque e assistente VOA.`,
      placement: "top",
      route: "/prestador/atendimento/*",
      order: 100,
    }),
    step({
      id: "page-campo",
      target: TOUR.content,
      title: "Diário de obra",
      content: `Registre apontamentos de campo, fotos e progresso das ${labels.appointments.toLowerCase()} em obra.`,
      placement: "top",
      route: "/prestador/campo*",
      order: 100,
    }),

    step({
      id: "content-fallback",
      target: TOUR.content,
      title: "Área de trabalho",
      content: "Execute atendimentos, consulte fichas e acompanhe sua produção aqui.",
      placement: "top",
      order: 200,
    }),

    step({
      id: "assistant",
      target: TOUR.assistant,
      title: "Assistente",
      content: "Tire dúvidas sobre fluxos clínicos, PEP e navegação do portal.",
      placement: "left",
      order: 900,
    }),
  ];
}

export function buildPjFeatures(labels: NicheLabels): OnboardingStep[] {
  return [
    step({
      id: "welcome",
      target: TOUR.header,
      title: `Portal da ${labels.company}`,
      content: `Gestão corporativa: ${labels.beneficiaries.toLowerCase()}, assinaturas, consumo Pay Per Use e faturas.`,
      placement: "bottom",
      order: 0,
    }),
    step({
      id: "nav-overview",
      target: TOUR.nav,
      title: "Seções da empresa",
      content:
        "Resumo, vidas ativas, assinaturas e faturas — role a página ou use as abas. Próximos passos destacam cada seção.",
      placement: "bottom",
      order: 10,
    }),
    step({
      id: "nav-resumo",
      target: TOUR.navTab("resumo"),
      title: "Resumo",
      content: "Contrato, consumo do período, MRR e faturas em aberto com exportação.",
      placement: "bottom",
      order: 20,
    }),
    step({
      id: "nav-beneficiarios",
      target: TOUR.navTab("beneficiarios"),
      title: labels.beneficiaries,
      content: `Tabela de ${labels.beneficiaries.toLowerCase()} com CPF, procedimentos utilizados e valores pendentes.`,
      placement: "bottom",
      order: 21,
    }),
    step({
      id: "nav-assinaturas",
      target: TOUR.navTab("assinaturas"),
      title: "Assinaturas",
      content: `Planos recorrentes por ${labels.beneficiary.toLowerCase()} com ciclo, valor e cobranças pendentes.`,
      placement: "bottom",
      order: 22,
    }),
    step({
      id: "nav-faturas",
      target: TOUR.navTab("faturas"),
      title: "Faturas",
      content: "Histórico de faturas da empresa com status e totais por beneficiário.",
      placement: "bottom",
      order: 23,
    }),

    step({
      id: "page-resumo",
      target: TOUR.section("resumo"),
      title: "Resumo executivo",
      content: "Indicadores do contrato B2B: vidas ativas, consumo Pay Per Use e faturas em aberto.",
      placement: "bottom",
      route: "/pj",
      order: 100,
    }),
    step({
      id: "page-beneficiarios",
      target: TOUR.section("beneficiarios"),
      title: labels.beneficiaries,
      content: `Acompanhe utilização e pendências de cada ${labels.beneficiary.toLowerCase()} vinculado ao plano corporativo.`,
      placement: "top",
      route: "/pj",
      order: 101,
    }),
    step({
      id: "page-assinaturas",
      target: TOUR.section("assinaturas"),
      title: "Assinaturas recorrentes",
      content: "Planos ativos por colaborador com ciclo de cobrança e status.",
      placement: "top",
      route: "/pj",
      order: 102,
    }),
    step({
      id: "page-faturas",
      target: TOUR.section("faturas"),
      title: "Faturas da empresa",
      content: "Faturas emitidas com data, beneficiário, status e valor total.",
      placement: "top",
      route: "/pj",
      order: 103,
    }),

    step({
      id: "content-fallback",
      target: TOUR.content,
      title: "Área de trabalho",
      content: "Todas as informações da empresa em uma única página — role ou use as abas acima.",
      placement: "top",
      order: 200,
    }),

    step({
      id: "assistant",
      target: TOUR.assistant,
      title: "Assistente",
      content: "Pergunte sobre gestão de vidas, faturas e assinaturas corporativas.",
      placement: "left",
      order: 900,
    }),
  ];
}

export function buildBeneficiarioFeatures(labels: NicheLabels, niche: NicheId = "MEDICAL"): OnboardingStep[] {
  const appt = labels.appointment.toLowerCase();
  const appts = labels.appointments.toLowerCase();
  const pr = labels.provider.toLowerCase();

  return [
    step({
      id: "welcome",
      target: TOUR.header,
      title: `Portal do ${labels.beneficiary}`,
      content: `Agende ${appts}, acompanhe consumo Pay Per Use, faturas PIX e seu ${labels.medicalRecord.toLowerCase()}.`,
      placement: "bottom",
      order: 0,
    }),
    step({
      id: "nav-overview",
      target: TOUR.nav,
      title: "Menu principal",
      content:
        "11 áreas do seu cuidado. No celular, abra o menu para navegar. Cada módulo tem um tour curto na primeira visita.",
      placement: "bottom",
      order: 10,
    }),
    step({
      id: "nav-modules",
      target: TOUR.nav,
      title: "Áreas do portal",
      content: `Seu acesso como ${labels.beneficiary.toLowerCase()}:\n\n${navLabelsSummary(buildBeneficiarioNavTabs(labels, niche))}`,
      placement: "bottom",
      order: 20,
    }),

    step({
      id: "page-agendar",
      target: TOUR.hotspot("schedule-form"),
      title: `Agendar ${appt}`,
      content: `Selecione procedimento, ${pr}, data, horário e modalidade (presencial ou tele).`,
      placement: "top",
      route: "/beneficiario/agendar*",
      order: 100,
    }),
    step({
      id: "page-resumo",
      target: TOUR.hotspot("care-journey"),
      title: "Jornada de cuidado",
      content: "Acompanhe etapas da sua jornada, perfil e indicadores de utilização do plano.",
      placement: "bottom",
      route: "/beneficiario/resumo",
      order: 100,
    }),
    step({
      id: "page-agenda",
      target: TOUR.content,
      title: "Minha agenda",
      content: `Liste ${appts}, cancele se necessário e acesse salas de telemedicina.`,
      placement: "top",
      route: "/beneficiario/agenda*",
      order: 100,
    }),
    step({
      id: "page-consumo",
      target: TOUR.content,
      title: "Consumo Pay Per Use",
      content: `Tabela de ${labels.procedures.toLowerCase()} com data, status de faturamento e valor.`,
      placement: "top",
      route: "/beneficiario/consumo*",
      order: 100,
    }),
    step({
      id: "page-faturas",
      target: TOUR.hotspot("beneficiario-pix-pay"),
      title: "Pagar com PIX",
      content: "Gere o código PIX mock, copie e confirme o pagamento da fatura em aberto.",
      placement: "left",
      route: "/beneficiario/faturas*",
      order: 100,
    }),
    step({
      id: "page-faturas-list",
      target: TOUR.content,
      title: "Faturas e PIX",
      content: "Visualize itens da fatura, exporte PDF/XLSX e acompanhe o status de pagamento.",
      placement: "top",
      route: "/beneficiario/faturas*",
      order: 101,
    }),
    step({
      id: "page-medicacoes",
      target: TOUR.content,
      title: "Medicações",
      content: "Prescrições ativas prescritas pelos prestadores da rede.",
      placement: "top",
      route: "/beneficiario/medicacoes*",
      order: 100,
    }),
    step({
      id: "page-exames",
      target: TOUR.content,
      title: "Exames",
      content: "Acompanhe pedidos, agendamentos e resultados disponíveis.",
      placement: "top",
      route: "/beneficiario/exames*",
      order: 100,
    }),
    step({
      id: "page-plano",
      target: TOUR.content,
      title: "Plano de cuidado",
      content: "Protocolos clínicos ativos e informações preventivas do seu plano.",
      placement: "top",
      route: "/beneficiario/plano*",
      order: 100,
    }),
    step({
      id: "page-assinatura",
      target: TOUR.content,
      title: "Assinatura",
      content: "Detalhes do plano recorrente e histórico de cobranças.",
      placement: "top",
      route: "/beneficiario/assinatura*",
      order: 100,
    }),
    step({
      id: "page-prontuario",
      target: TOUR.content,
      title: labels.medicalRecord,
      content: `Registros clínicos organizados por data e ${pr}.`,
      placement: "top",
      route: "/beneficiario/prontuario*",
      order: 100,
    }),
    step({
      id: "page-historico",
      target: TOUR.content,
      title: "Histórico completo",
      content: "Linha do tempo de consultas, procedimentos, faturas e eventos.",
      placement: "top",
      route: "/beneficiario/historico*",
      order: 100,
    }),

    step({
      id: "content-fallback",
      target: TOUR.content,
      title: "Área de trabalho",
      content: "Conteúdo da aba selecionada aparece aqui.",
      placement: "top",
      order: 200,
    }),

    step({
      id: "assistant",
      target: TOUR.assistant,
      title: "Assistente",
      content: "Tire dúvidas sobre agendamento, plano, faturas e histórico.",
      placement: "left",
      order: 900,
    }),
  ];
}

/** Filtra passos internos pelo RBAC e remove módulos sem permissão. */
export function filterByPermissions(
  steps: OnboardingStep[],
  permissions?: InternoModule[],
): OnboardingStep[] {
  if (!permissions || permissions.length === 0) return steps;
  return steps.filter((s) => !s.module || permissions.includes(s.module));
}
