import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import AtendimentoView from "@/components/AtendimentoView";

export default async function AtendimentoPage(
  props: PageProps<"/prestador/atendimento/[id]">,
) {
  const user = await getSessionUser();
  if (!user || user.role !== "PRESTADOR") {
    redirect("/login");
  }
  const { id } = await props.params;
  const portal = PORTALS.prestador;

  return (
    <PortalShell
      portal="prestador"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
    >
      <AtendimentoView appointmentId={id} />
    </PortalShell>
  );
}
