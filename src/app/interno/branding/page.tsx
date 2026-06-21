import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import BrandingView from "@/components/BrandingView";

export default async function InternoBrandingPage() {
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
        title="Identidade visual"
        description="Configure marca, cores e white label do tenant. Alterações refletem em todos os portais após salvar."
      />
      <InternoNav active="branding" />
      <div className="mt-8">
        <BrandingView />
      </div>
    </PortalShell>
  );
}
