import PageHeader from "@/components/layout/PageHeader";
import ProjectDetailView from "@/components/projects/ProjectDetailView";
import { requireInternoPage } from "@/lib/interno-guard";

type Props = { params: Promise<{ id: string }> };

export default async function InternoProjetoDetailPage({ params }: Props) {
  await requireInternoPage("projetos");
  const { id } = await params;

  return (
    <>
      <PageHeader title="Detalhe da obra" description="Orçamento, cronograma e anexos técnicos." />
      <ProjectDetailView projectId={id} />
    </>
  );
}
