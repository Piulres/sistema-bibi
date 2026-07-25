import PageHeader from "@/components/layout/PageHeader";
import ClinicFinanceView from "@/components/ClinicFinanceView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoGestaoPage() {
  await requireInternoPage("gestao");

  return (
    <>
      <PageHeader
        title="Gestão clínica"
        description="Lançamentos por paciente, despesas do mês e indicadores automáticos — pensado para a secretária e para a direção."
      />
      <ClinicFinanceView />
    </>
  );
}
