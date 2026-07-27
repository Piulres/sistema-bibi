import PageHeader from "@/components/layout/PageHeader";
import ExecutiveDashboardView from "@/components/ExecutiveDashboardView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function ExecutiveDashboardPage() {
  await requireInternoPage("dashboard");

  return (
    <>
      <PageHeader
        title="Dashboard Executivo"
        description="Cobrança (faturas), produção clínica do mês e CRM — cada bloco com um eixo claro."
      />
      <ExecutiveDashboardView />
    </>
  );
}
