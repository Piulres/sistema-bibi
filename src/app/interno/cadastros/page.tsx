import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import CadastrosView from "@/components/CadastrosView";

export default async function CadastrosPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNO") redirect("/interno/login");

  const portal = PORTALS.interno;

  return (
    <PortalShell portal="interno" portalLabel={portal.label} loginPath={portal.loginPath} userName={user.name} branding={user.branding}>
      <PageHeader title="Cadastros" description="Beneficiários, empresas, procedimentos e usuários do tenant." />
      <InternoNav active="cadastros" />
      <div className="mt-8">
        <CadastrosView />
      </div>
    </PortalShell>
  );
}
