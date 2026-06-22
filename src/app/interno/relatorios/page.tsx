import PageHeader from "@/components/layout/PageHeader";
import ReportsView from "@/components/ReportsView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoReportsPage() {
  await requireInternoPage("relatorios");

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Exportações e indicadores operacionais do tenant."
      />
      <ReportsView />
    </>
  );
}
