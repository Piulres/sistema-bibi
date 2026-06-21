import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import AppointmentsView from "@/components/AppointmentsView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function AgendaInternoPage() {
  const user = await requireInternoPage("agenda");
  const portal = PORTALS.interno;

  return (
    <PortalShell portal="interno" portalLabel={portal.label} loginPath={portal.loginPath} userName={user.name} branding={user.branding}>
      <PageHeader title="Agenda" description="Agendamentos e confirmações da clínica." />
      <InternoNav active="agenda" permissions={user.internoPermissions} />
      <div className="mt-8">
        <AppointmentsView />
      </div>
    </PortalShell>
  );
}
