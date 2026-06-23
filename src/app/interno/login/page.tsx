import LoginForm from "@/components/LoginForm";
import { getLoginSegmentContext } from "@/lib/segment/login-context";
import { SEGMENT_TENANTS, segmentTenantByNiche } from "@/lib/niche/demo-accounts";

type PageProps = {
  searchParams: Promise<{ tenant?: string; niche?: string }>;
};

export default async function InternoLoginPage({ searchParams }: PageProps) {
  const { tenant: tenantParam, niche: nicheParam } = await searchParams;
  const context = await getLoginSegmentContext({
    tenantSlug: tenantParam,
    nicheParam,
  });

  const defaultDemo = context.tenantSlug
    ? SEGMENT_TENANTS.find((t) => t.slug === context.tenantSlug) ?? segmentTenantByNiche(context.niche)
    : segmentTenantByNiche(context.niche);

  return (
    <LoginForm
      portal="interno"
      title="Portal Interno"
      subtitle={`Administre operação e faturamento de ${context.tenantName ?? context.nicheName}.`}
      demoEmail={defaultDemo.internoEmail}
      demoPassword="bibi123"
      branding={context.branding}
      segmentContext={context}
      nicheDemos={SEGMENT_TENANTS.map(({ niche, tenant, internoEmail }) => ({
        niche,
        tenant,
        internoEmail,
      }))}
    />
  );
}
