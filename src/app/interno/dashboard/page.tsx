import PageHeader from "@/components/layout/PageHeader";
import ExecutiveDashboardView from "@/components/ExecutiveDashboardView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function ExecutiveDashboardPage() {
  await requireInternoPage("dashboard");

  return (
    <>
      <PageHeader
        title="Dashboard Executivo"
        description="Receita, operação e CRM do tenant — o que precisa de atenção agora."
      />
      <ExecutiveDashboardView />
    </>
  );
}
