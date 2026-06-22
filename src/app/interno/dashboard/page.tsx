import PageHeader from "@/components/layout/PageHeader";
import ExecutiveDashboardView from "@/components/ExecutiveDashboardView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function ExecutiveDashboardPage() {
  await requireInternoPage("dashboard");

  return (
    <>
      <PageHeader
        title="Dashboard Executivo"
        description="Visão consolidada de receita, operação, CRM e atividade do tenant."
      />
      <ExecutiveDashboardView />
    </>
  );
}
