import PageHeader from "@/components/layout/PageHeader";
import ConstructionFinanceView from "@/components/projects/ConstructionFinanceView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoProjetosFinanceiroPage() {
  await requireInternoPage("projetos");

  return (
    <>
      <PageHeader
        title="Financeiro da empresa"
        description="Indiretas, fluxo de caixa projetado e caixa consolidado por obra."
      />
      <ConstructionFinanceView />
    </>
  );
}
