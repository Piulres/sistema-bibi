import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import BeneficiarioView from "@/components/BeneficiarioView";

export default async function BeneficiarioPlanoPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "BENEFICIARIO" || !user.patientId) {
    redirect("/beneficiario/login");
  }

  return (
    <>
      <PageHeader
        title="Meu plano de cuidado"
        description="Protocolos clínicos ativos e acompanhamento."
      />
      <BeneficiarioView section="plano" />
    </>
  );
}
