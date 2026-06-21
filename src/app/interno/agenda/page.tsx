import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import AppointmentsView from "@/components/AppointmentsView";

export default async function AgendaInternoPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNO") redirect("/interno/login");

  const portal = PORTALS.interno;

  return (
    <PortalShell portal="interno" portalLabel={portal.label} loginPath={portal.loginPath} userName={user.name} branding={user.branding}>
      <PageHeader title="Agenda" description="Agendamentos e confirmações da clínica." />
      <InternoNav active="agenda" />
      <div className="mt-8">
        <AppointmentsView />
      </div>
    </PortalShell>
  );
}
