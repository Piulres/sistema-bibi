import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import BeneficiarioView from "@/components/BeneficiarioView";

export default async function BeneficiarioConsumoPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "BENEFICIARIO" || !user.patientId) {
    redirect("/beneficiario/login");
  }

  return (
    <>
      <PageHeader
        title="Meu consumo"
        description="Procedimentos Pay Per Use utilizados."
      />
      <BeneficiarioView section="consumo" />
    </>
  );
}
