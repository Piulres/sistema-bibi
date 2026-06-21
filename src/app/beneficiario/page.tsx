import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
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

  const portal = PORTALS.beneficiario;

  return (
    <PortalShell
      portal="beneficiario"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
    >
      <PageHeader
        title={`Olá, ${user.patientName ?? user.name}`}
        description="Acompanhe seus atendimentos, consumo e faturamento com transparência."
      />
      <div className="mt-8">
        <BeneficiarioView />
      </div>
    </PortalShell>
  );
}
