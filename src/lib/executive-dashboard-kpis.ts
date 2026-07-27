/**
 * Resumo puro de faturas para o Dashboard Executivo.
 * Separar eixos evita confundir "emitido", "a receber" e "recebido".
 */

export type InvoiceMoneyRow = {
  total: number;
  status: string;
};

export type InvoiceMoneySummary = {
  /** FECHADA + ABERTA — aguardando pagamento */
  open: number;
  openCount: number;
  /** PAGA — já liquidado */
  paid: number;
  paidCount: number;
  /** open + paid (exclui ANULADA e outros) */
  emitted: number;
  emittedCount: number;
};

export function summarizeInvoiceMoney(
  invoices: ReadonlyArray<InvoiceMoneyRow>,
): InvoiceMoneySummary {
  let open = 0;
  let openCount = 0;
  let paid = 0;
  let paidCount = 0;

  for (const inv of invoices) {
    if (inv.status === "PAGA") {
      paid += inv.total;
      paidCount += 1;
      continue;
    }
    if (inv.status === "ABERTA" || inv.status === "FECHADA") {
      open += inv.total;
      openCount += 1;
    }
  }

  return {
    open,
    openCount,
    paid,
    paidCount,
    emitted: open + paid,
    emittedCount: openCount + paidCount,
  };
}
