/**
 * KPIs leves do mês a partir das listas já carregadas na UI.
 * Evita chamar /kpis só para a faixa superior da gestão clínica.
 */
export function summarizeClinicMonthStrip(input: {
  launches: { amountReceived: number }[];
  expenses: { amount: number }[];
}) {
  const revenue = input.launches.reduce((s, l) => s + l.amountReceived, 0);
  const totalExpenses = input.expenses.reduce((s, e) => s + e.amount, 0);
  const examCount = input.launches.length;
  return {
    revenue,
    totalExpenses,
    operatingProfit: revenue - totalExpenses,
    examCount,
    averageTicket: examCount > 0 ? revenue / examCount : 0,
  };
}
