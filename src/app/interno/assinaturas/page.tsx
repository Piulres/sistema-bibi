import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import SubscriptionsView from "@/components/SubscriptionsView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoSubscriptionsPage() {
  const user = await requireInternoPage("subscriptions");
  const portal = PORTALS.interno;

  return (
    <PortalShell
      portal="interno"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
    >
      <PageHeader title="Recorrência" description="Assinaturas e cobranças recorrentes." />
      <InternoNav active="subscriptions" permissions={user.internoPermissions} />
      <div className="mt-8">
        <SubscriptionsView />
      </div>
    </PortalShell>
  );
}
