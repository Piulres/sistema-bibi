import PageHeader from "@/components/layout/PageHeader";
import BeneficiarioObrasView from "@/components/projects/BeneficiarioObrasView";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function BeneficiarioObrasPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "BENEFICIARIO") redirect("/beneficiario/login");
  if (user.niche !== "CONSTRUCTION") redirect("/beneficiario");

  return (
    <>
      <PageHeader title="Minhas obras" description="Acompanhe cronograma e andamento da sua obra." />
      <BeneficiarioObrasView />
    </>
  );
}
