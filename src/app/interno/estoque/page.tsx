import PageHeader from "@/components/layout/PageHeader";
import StockView from "@/components/StockView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoEstoquePage() {
  await requireInternoPage("estoque");

  return (
    <>
      <PageHeader
        title="Estoque Médico"
        description="Gestão de medicamentos, materiais e insumos com rastreabilidade por lote e validade (ANVISA)."
      />
      <StockView />
    </>
  );
}
