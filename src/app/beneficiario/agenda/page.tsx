import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import BeneficiarioView from "@/components/BeneficiarioView";

export default async function BeneficiarioAgendaPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "BENEFICIARIO" || !user.patientId) {
    redirect("/beneficiario/login");
  }

  return (
    <>
      <PageHeader
        title="Minha agenda"
        description="Consultas agendadas e histórico."
      />
      <BeneficiarioView section="agenda" />
    </>
  );
}
