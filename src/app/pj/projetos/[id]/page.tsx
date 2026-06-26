import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import PjProjectDetailView from "@/components/projects/PjProjectDetailView";

type Props = { params: Promise<{ id: string }> };

export default async function PjProjetoDetailPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user || user.role !== "PJ") {
    redirect("/pj/login");
  }

  const { id } = await params;

  return (
    <>
      <PageHeader title="Detalhe da obra" description="Proposta, cronograma e anexos compartilhados." />
      <PjProjectDetailView projectId={id} />
    </>
  );
}
