import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import AgendaView from "@/components/AgendaView";

export default async function PrestadorDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== "PRESTADOR") {
    redirect("/login");
  }

  const portal = PORTALS.prestador;

  return (
    <PortalShell
      portal="prestador"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
    >
      <PageHeader
        title={`Bem-vinda, ${user.name}`}
        description="Sua agenda do dia e acesso rápido ao prontuário eletrônico."
      />
      <div className="mt-8">
        <AgendaView />
      </div>
    </PortalShell>
  );
}
