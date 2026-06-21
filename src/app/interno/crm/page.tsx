import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import CrmPipelineView from "@/components/CrmPipelineView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoCrmPage() {
  const user = await requireInternoPage("crm");
  const portal = PORTALS.interno;

  return (
    <PortalShell
      portal="interno"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
    >
      <PageHeader title="CRM Corporativo" description="Pipeline de empresas e status de contrato." />
      <InternoNav active="crm" permissions={user.internoPermissions} />
      <div className="mt-8">
        <CrmPipelineView />
      </div>
    </PortalShell>
  );
}
