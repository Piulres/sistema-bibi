import PageHeader from "@/components/layout/PageHeader";
import BeneficiarioObraDetailView from "@/components/projects/BeneficiarioObraDetailView";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function BeneficiarioObraDetailPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user || user.role !== "BENEFICIARIO") redirect("/beneficiario/login");
  if (user.niche !== "CONSTRUCTION") redirect("/beneficiario");

  const { id } = await params;

  return (
    <>
      <PageHeader title="Acompanhamento da obra" />
      <BeneficiarioObraDetailView projectId={id} />
    </>
  );
}
