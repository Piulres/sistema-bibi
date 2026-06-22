import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import BeneficiarioView from "@/components/BeneficiarioView";

export default async function BeneficiarioDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== "BENEFICIARIO") {
    redirect("/beneficiario/login");
  }
  if (!user.patientId) {
    redirect("/beneficiario/login");
  }

  return (
    <>
      <PageHeader
        title={`Olá, ${user.patientName ?? user.name}`}
        description="Acompanhe seus atendimentos, consumo e faturamento com transparência."
      />
      <BeneficiarioView />
    </>
  );
}
