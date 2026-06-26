import PageHeader from "@/components/layout/PageHeader";
import ProjectsView from "@/components/projects/ProjectsView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoProjetosPage() {
  await requireInternoPage("projetos");

  return (
    <>
      <PageHeader
        title="Obras e projetos"
        description="Status, orçamentos, cronogramas e documentação técnica."
      />
      <ProjectsView />
    </>
  );
}
