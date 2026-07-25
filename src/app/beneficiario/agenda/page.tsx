import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import BeneficiarioView from "@/components/BeneficiarioView";
import { getTenantLabelsById } from "@/lib/niche/tenant-labels";

export default async function BeneficiarioAgendaPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "BENEFICIARIO" || !user.patientId) {
    redirect("/beneficiario/login");
  }

  const labels = await getTenantLabelsById(user.tenantId);

  return (
    <>
      <PageHeader
        title="Minha agenda"
        description={`${labels.appointments} agendados e histórico.`}
      />
      <BeneficiarioView section="agenda" />
    </>
  );
}
