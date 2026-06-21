import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import SubscriptionsView from "@/components/SubscriptionsView";

export default async function InternoSubscriptionsPage() {
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
        title="Recorrência"
        description="Assinaturas e geração automática de cobranças futuras."
      />
      <InternoNav active="subscriptions" />
      <div className="mt-8">
        <SubscriptionsView />
      </div>
    </PortalShell>
  );
}
