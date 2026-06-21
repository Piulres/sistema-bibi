import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import ReportsView from "@/components/ReportsView";

export default async function ReportsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNO") redirect("/interno/login");

  const portal = PORTALS.interno;

  return (
    <PortalShell portal="interno" portalLabel={portal.label} loginPath={portal.loginPath} userName={user.name} branding={user.branding}>
      <PageHeader title="Relatórios" description="Exportação CSV de faturamento e CRM." />
      <InternoNav active="relatorios" />
      <div className="mt-8">
        <ReportsView />
      </div>
    </PortalShell>
  );
}
