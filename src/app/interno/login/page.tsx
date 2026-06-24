import LoginForm from "@/components/LoginForm";
import { getLoginSegmentContext } from "@/lib/segment/login-context";
import {
  demoEmailForPortal,
  loginNicheDemoOptions,
  resolveSegmentTenantRef,
} from "@/lib/segment/login-demo";

type PageProps = {
  searchParams: Promise<{ tenant?: string; niche?: string }>;
};

export default async function InternoLoginPage({ searchParams }: PageProps) {
  const { tenant: tenantParam, niche: nicheParam } = await searchParams;
  const context = await getLoginSegmentContext({
    tenantSlug: tenantParam,
    nicheParam,
  });

  const tenantRef = resolveSegmentTenantRef(context.tenantSlug, context.niche);

  return (
    <LoginForm
      portal="interno"
      title="Portal Interno"
      subtitle={`Administre operação e faturamento de ${context.tenantName ?? tenantRef.tenant}.`}
      demoEmail={demoEmailForPortal(tenantRef, "interno")}
      demoPassword="bibi123"
      branding={context.branding}
      segmentContext={context}
      nicheDemos={loginNicheDemoOptions()}
    />
  );
}
