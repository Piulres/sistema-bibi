import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import BeneficiarioView from "@/components/BeneficiarioView";

export default async function BeneficiarioAssinaturaPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "BENEFICIARIO" || !user.patientId) {
    redirect("/beneficiario/login");
  }

  return (
    <>
      <PageHeader
        title="Minha assinatura"
        description="Plano recorrente e cobranças."
      />
      <BeneficiarioView section="assinatura" />
    </>
  );
}
