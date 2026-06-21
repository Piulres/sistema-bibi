import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import ComunicacaoView from "@/components/ComunicacaoView";

export default async function ComunicacaoPage() {
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
        title="Comunicação"
        description="Enfileire lembretes e notificações por e-mail, SMS ou WhatsApp."
      />
      <InternoNav active="comunicacao" />
      <div className="mt-8">
        <ComunicacaoView />
      </div>
    </PortalShell>
  );
}
