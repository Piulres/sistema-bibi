import LoginForm from "@/components/LoginForm";
import { getLoginSegmentContext } from "@/lib/segment/login-context";
import { segmentTenantByNiche } from "@/lib/niche/demo-accounts";

type PageProps = {
  searchParams: Promise<{ tenant?: string; niche?: string }>;
};

export default async function PrestadorLoginPage({ searchParams }: PageProps) {
  const { tenant: tenantParam, niche: nicheParam } = await searchParams;
  const context = await getLoginSegmentContext({ tenantSlug: tenantParam, nicheParam });
  const demo = segmentTenantByNiche(context.niche);

  return (
    <LoginForm
      portal="prestador"
      title={`Portal do ${context.labels.portalProvider.replace("Portal do ", "")}`}
      subtitle={`Acesse agenda e registros de ${context.labels.procedures.toLowerCase()} da operação ${context.tenantName ?? context.nicheName}.`}
      demoEmail={demo.providerEmail}
      demoPassword="bibi123"
      branding={context.branding}
      segmentContext={context}
    />
  );
}
