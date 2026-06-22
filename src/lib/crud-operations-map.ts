/** Mapa estático das operações CRUD expostas na UI — fonte para a aba Cadastros. */
export type CrudOp = {
  entity: string;
  create: string;
  read: string;
  update: string;
  delete: string;
};

export const CRUD_OPERATIONS_MAP: CrudOp[] = [
  {
    entity: "Beneficiário / paciente",
    create: "Cadastros → Beneficiários · Agenda → walk-in particular",
    read: "Cadastros · Cliente 360° · Agenda",
    update: "Cadastros → Editar",
    delete: "— (auditoria; sem exclusão na POC)",
  },
  {
    entity: "Empresa (PJ)",
    create: "Cadastros → Empresas",
    read: "Cadastros · CRM · Portal PJ",
    update: "Cadastros → Editar · CRM (status)",
    delete: "—",
  },
  {
    entity: "Procedimento",
    create: "Cadastros → Procedimentos",
    read: "Cadastros · Atendimento prestador",
    update: "Cadastros → Editar",
    delete: "Cadastros → Excluir",
  },
  {
    entity: "Usuário",
    create: "Cadastros → Usuários",
    read: "Cadastros",
    update: "Cadastros → Editar",
    delete: "—",
  },
  {
    entity: "Agendamento",
    create: "Agenda · Walk-in · Beneficiário (portal)",
    read: "Agenda · Prestador · Beneficiário",
    update: "Agenda (status / check-in)",
    delete: "Cancelado via status CANCELADO",
  },
  {
    entity: "Fatura Pay Per Use",
    create: "Faturamento → Gerar fatura",
    read: "Faturamento · Cliente 360° · Beneficiário",
    update: "Marcar paga · PIX mock",
    delete: "—",
  },
  {
    entity: "Assinatura recorrente",
    create: "Recorrência",
    read: "Recorrência · Cliente 360°",
    update: "Status · Gerar cobranças · Faturar cobrança",
    delete: "—",
  },
  {
    entity: "Mensagem / campanha",
    create: "Comunicação",
    read: "Comunicação",
    update: "Cancelar · Despachar",
    delete: "—",
  },
  {
    entity: "Webhook B2B",
    create: "Integrações",
    read: "Integrações · Log entregas",
    update: "Ativar/desativar",
    delete: "Integrações → Excluir",
  },
  {
    entity: "Branding white label",
    create: "— (upsert)",
    read: "White Label",
    update: "White Label · Upload logo",
    delete: "—",
  },
  {
    entity: "PEP / procedimento no atendimento",
    create: "Prestador → Atendimento",
    read: "Prestador · Cliente 360°",
    update: "Marcar consulta realizada",
    delete: "—",
  },
];
