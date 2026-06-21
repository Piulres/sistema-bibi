import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PORTALS } from "@/lib/roles";
import PortalShell from "@/components/layout/PortalShell";
import PageHeader from "@/components/layout/PageHeader";
import InternoNav from "@/components/InternoNav";
import BillingView from "@/components/BillingView";

export default async function InternoBillingPage() {
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
        title="Faturamento"
        description="Controle financeiro e geração de faturas Pay Per Use."
      />
      <InternoNav active="billing" />
      <div className="mt-8">
        <BillingView />
      </div>
    </PortalShell>
  );
}
