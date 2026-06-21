import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import BrandingView from "@/components/BrandingView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function InternoBrandingPage() {
  const user = await requireInternoPage("branding");
  const portal = PORTALS.interno;

  return (
    <PortalShell
      portal="interno"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
    >
      <PageHeader title="White Label" description="Identidade visual, logo e domínio customizado." />
      <InternoNav active="branding" permissions={user.internoPermissions} />
      <div className="mt-8">
        <BrandingView />
      </div>
    </PortalShell>
  );
}
