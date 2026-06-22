import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import SecurityView from "@/components/SecurityView";
import DemoResetCard from "@/components/DemoResetCard";
import { requireInternoPage } from "@/lib/interno-guard";
import { isInternoAdmin } from "@/lib/interno-permissions";
import { isDemoResetEnabled } from "@/lib/demo-reset";

export default async function SegurancaPage() {
  const user = await requireInternoPage("seguranca");
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
        title="Segurança"
        description="MFA TOTP e políticas de acesso da sua conta interna."
      />
      <InternoNav active="seguranca" permissions={user.internoPermissions} />
      <div className="mt-8 space-y-6">
        <SecurityView />
        {isDemoResetEnabled() && isInternoAdmin(user.role, user.internoProfile) && (
          <DemoResetCard isAdmin />
        )}
      </div>
    </PortalShell>
  );
}
