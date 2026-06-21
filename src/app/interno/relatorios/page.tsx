import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import ReportsView from "@/components/ReportsView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function ReportsPage() {
  const user = await requireInternoPage("relatorios");
  const portal = PORTALS.interno;

  return (
    <PortalShell portal="interno" portalLabel={portal.label} loginPath={portal.loginPath} userName={user.name} branding={user.branding}>
      <PageHeader title="Relatórios" description="Exportação CSV de faturamento e CRM." />
      <InternoNav active="relatorios" permissions={user.internoPermissions} />
      <div className="mt-8">
        <ReportsView />
      </div>
    </PortalShell>
  );
}
