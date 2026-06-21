import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import CrmPipelineView from "@/components/CrmPipelineView";

export default async function InternoCrmPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNO") {
    redirect("/interno/login");
  }

  const portal = PORTALS.interno;

  return (
    <PortalShell
      portal="interno"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
    >
      <PageHeader
        title="CRM Corporativo"
        description="Pipeline de empresas contratantes — do lead ao contrato ativo."
      />
      <InternoNav active="crm" />
      <div className="mt-8">
        <CrmPipelineView />
      </div>
    </PortalShell>
  );
}
