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

export default async function PjLoginPage({ searchParams }: PageProps) {
  const { tenant: tenantParam, niche: nicheParam } = await searchParams;
  const context = await getLoginSegmentContext({ tenantSlug: tenantParam, nicheParam });
  const tenantRef = resolveSegmentTenantRef(context.tenantSlug, context.niche);

  return (
    <LoginForm
      portal="pj"
      title={`Portal ${context.labels.company}`}
      subtitle={`Gestão de contratos e ${context.labels.beneficiaries.toLowerCase()} — ${context.tenantName ?? tenantRef.tenant}.`}
      demoEmail={demoEmailForPortal(tenantRef, "pj")}
      demoPassword="bibi123"
      branding={context.branding}
      segmentContext={context}
      nicheDemos={loginNicheDemoOptions()}
    />
  );
}
