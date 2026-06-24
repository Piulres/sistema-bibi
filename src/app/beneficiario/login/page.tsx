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

export default async function BeneficiarioLoginPage({ searchParams }: PageProps) {
  const { tenant: tenantParam, niche: nicheParam } = await searchParams;
  const context = await getLoginSegmentContext({ tenantSlug: tenantParam, nicheParam });
  const tenantRef = resolveSegmentTenantRef(context.tenantSlug, context.niche);

  return (
    <LoginForm
      portal="beneficiario"
      title={`Portal do ${context.labels.beneficiary}`}
      subtitle={`Agenda, consumo e faturas para ${context.labels.beneficiaries.toLowerCase()} da operação ${context.tenantName ?? tenantRef.tenant}.`}
      demoEmail={demoEmailForPortal(tenantRef, "beneficiario")}
      demoPassword="bibi123"
      branding={context.branding}
      segmentContext={context}
      nicheDemos={loginNicheDemoOptions()}
    />
  );
}
