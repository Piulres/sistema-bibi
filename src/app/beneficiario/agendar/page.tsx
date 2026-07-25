import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PageHeader from "@/components/layout/PageHeader";
import BeneficiarioView from "@/components/BeneficiarioView";
import { getTenantLabelsById } from "@/lib/niche/tenant-labels";

export default async function BeneficiarioAgendarPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "BENEFICIARIO" || !user.patientId) {
    redirect("/beneficiario/login");
  }

  const labels = await getTenantLabelsById(user.tenantId);

  return (
    <>
      <PageHeader
        title={`Agendar ${labels.appointment.toLowerCase()}`}
        description={`Escolha ${labels.provider.toLowerCase()}, data e horário.`}
      />
      <BeneficiarioView section="agendar" />
    </>
  );
}
