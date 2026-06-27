import type { ConfirmOptions } from "@/hooks/useConfirm";

/** Presets de confirmação para ações destrutivas ou sensíveis. */
export const confirmPresets = {
  delete: (itemLabel: string): ConfirmOptions => ({
    title: "Confirmar exclusão",
    message: `Excluir ${itemLabel}? Esta ação não pode ser desfeita pelo atalho rápido.`,
    confirmLabel: "Excluir",
    cancelLabel: "Cancelar",
    tone: "danger",
  }),

  cancelAppointment: (whenLabel: string): ConfirmOptions => ({
    title: "Cancelar agendamento",
    message: `Cancelar o agendamento de ${whenLabel}?`,
    confirmLabel: "Cancelar agendamento",
    cancelLabel: "Voltar",
    tone: "warning",
  }),

  voidInvoice: (patientName: string, totalLabel: string): ConfirmOptions => ({
    title: "Anular fatura",
    message: `Anular a fatura de ${patientName} (${totalLabel})? Os itens voltarão para faturamento.`,
    confirmLabel: "Anular fatura",
    cancelLabel: "Voltar",
    tone: "danger",
  }),

  markPaid: (totalLabel: string): ConfirmOptions => ({
    title: "Confirmar pagamento",
    message: `Marcar fatura de ${totalLabel} como paga manualmente?`,
    confirmLabel: "Confirmar pagamento",
    cancelLabel: "Voltar",
    tone: "warning",
  }),

  confirmPix: (totalLabel: string): ConfirmOptions => ({
    title: "Confirmar PIX",
    message: `Confirmar recebimento do PIX (${totalLabel})?`,
    confirmLabel: "Confirmar PIX",
    cancelLabel: "Voltar",
    tone: "warning",
  }),

  deleteWebhook: (label: string): ConfirmOptions => ({
    title: "Remover webhook",
    message: `Remover o webhook "${label}"? Entregas pendentes serão perdidas.`,
    confirmLabel: "Remover",
    cancelLabel: "Cancelar",
    tone: "danger",
  }),

  restoreAudit: (): ConfirmOptions => ({
    title: "Restaurar versão anterior",
    message: "Restaurar o estado anterior deste registro? Um novo evento será registrado na auditoria.",
    confirmLabel: "Restaurar",
    cancelLabel: "Cancelar",
    tone: "warning",
    requiredPhrase: "RESTAURAR",
  }),

  demoReset: (): ConfirmOptions => ({
    title: "Restaurar modo demo",
    message: "Isso apagará alterações no banco demo e repopulará o seed original.",
    confirmLabel: "Restaurar demo",
    cancelLabel: "Cancelar",
    tone: "danger",
    requiredPhrase: "RESTAURAR",
  }),

  switchDataStore: (targetLabel: string): ConfirmOptions => ({
    title: `Alternar para ${targetLabel}`,
    message: `Trocar o ambiente de dados para ${targetLabel}? A sessão continuará, mas os dados exibidos mudarão.`,
    confirmLabel: "Alternar",
    cancelLabel: "Cancelar",
    tone: "warning",
  }),

  cancelMessage: (patientName: string): ConfirmOptions => ({
    title: "Cancelar mensagem",
    message: `Cancelar a mensagem pendente para ${patientName}?`,
    confirmLabel: "Cancelar mensagem",
    cancelLabel: "Voltar",
    tone: "warning",
  }),

  disableMfa: (): ConfirmOptions => ({
    title: "Desativar MFA",
    message:
      "Desativar a autenticação em dois fatores? Sua conta ficará protegida apenas por senha.",
    confirmLabel: "Desativar MFA",
    cancelLabel: "Cancelar",
    tone: "danger",
  }),

  cancelSubscription: (patientName: string): ConfirmOptions => ({
    title: "Cancelar assinatura",
    message: `Cancelar a assinatura de ${patientName}? Cobranças pendentes precisarão ser tratadas manualmente.`,
    confirmLabel: "Cancelar assinatura",
    cancelLabel: "Voltar",
    tone: "danger",
  }),
} as const;
