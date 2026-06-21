import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import PjView from "@/components/PjView";

export default async function PjDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== "PJ") {
    redirect("/pj/login");
  }

  const portal = PORTALS.pj;

  return (
    <PortalShell
      portal="pj"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
    >
      <PageHeader
        title={user.companyName ?? "Empresa"}
        description="Gestão de contrato, beneficiários e faturas corporativas."
      />
      <div className="mt-8">
        <PjView />
      </div>
    </PortalShell>
  );
}
