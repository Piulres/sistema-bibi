import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import CadastrosView from "@/components/CadastrosView";
import { requireInternoPage } from "@/lib/interno-guard";

export default async function CadastrosPage() {
  const user = await requireInternoPage("cadastros");
  const portal = PORTALS.interno;

  return (
    <PortalShell portal="interno" portalLabel={portal.label} loginPath={portal.loginPath} userName={user.name} branding={user.branding}>
      <PageHeader title="Cadastros" description="Beneficiários, empresas, procedimentos e usuários." />
      <InternoNav active="cadastros" permissions={user.internoPermissions} />
      <div className="mt-8">
        <CadastrosView />
      </div>
    </PortalShell>
  );
}
