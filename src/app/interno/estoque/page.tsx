import PageHeader from "@/components/layout/PageHeader";
import StockView from "@/components/StockView";
import { requireInternoPage } from "@/lib/interno-guard";
import { estoqueTabLabel } from "@/lib/navigation/niche-nav";

export default async function InternoEstoquePage() {
  const user = await requireInternoPage("estoque");
  const isClinical = user.niche === "MEDICAL" || user.niche === "DENTAL";

  return (
    <>
      <PageHeader
        title={estoqueTabLabel(user.niche)}
        description={
          isClinical
            ? "Gestão de medicamentos, materiais e insumos com rastreabilidade por lote e validade (ANVISA)."
            : "Gestão de materiais e insumos com rastreabilidade por lote e validade."
        }
      />
      <StockView />
    </>
  );
}
