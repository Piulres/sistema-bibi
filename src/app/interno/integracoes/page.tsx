import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import IntegracoesView from "@/components/IntegracoesView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function IntegracoesPage() {
  const user = await requireInternoPage("integracoes");
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
        title="Integrações B2B"
        description="Webhooks outbound para ERPs, folha de pagamento e parceiros corporativos."
      />
      <InternoNav active="integracoes" permissions={user.internoPermissions} />
      <div className="mt-8">
        <IntegracoesView />
      </div>
    </PortalShell>
  );
}
