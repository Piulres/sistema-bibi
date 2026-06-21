import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import ExecutiveDashboardView from "@/components/ExecutiveDashboardView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function ExecutiveDashboardPage() {
  const user = await requireInternoPage("dashboard");
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
        title="Dashboard Executivo"
        description="Visão consolidada de receita, operação, CRM e atividade do tenant."
      />
      <InternoNav active="dashboard" permissions={user.internoPermissions} />
      <div className="mt-8">
        <ExecutiveDashboardView />
      </div>
    </PortalShell>
  );
}
