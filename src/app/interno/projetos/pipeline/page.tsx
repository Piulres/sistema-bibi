import PageHeader from "@/components/layout/PageHeader";
import ConstructionPipelineView from "@/components/projects/ConstructionPipelineView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoProjetosPipelinePage() {
  await requireInternoPage("projetos");

  return (
    <>
      <PageHeader
        title="Pipeline comercial"
        description="Leads, propostas e metas para cobrir BDI e indiretas da empreiteira."
      />
      <ConstructionPipelineView />
    </>
  );
}
