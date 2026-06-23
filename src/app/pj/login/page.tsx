import LoginForm from "@/components/LoginForm";
import { getLoginSegmentContext } from "@/lib/segment/login-context";
import { persistSegmentCookie } from "@/lib/segment/cookie";

type PageProps = {
  searchParams: Promise<{ tenant?: string; niche?: string }>;
};

export default async function PjLoginPage({ searchParams }: PageProps) {
  const { tenant: tenantParam, niche: nicheParam } = await searchParams;
  const context = await getLoginSegmentContext({ tenantSlug: tenantParam, nicheParam });
  await persistSegmentCookie(context);

  return (
    <LoginForm
      portal="pj"
      title={`Portal ${context.labels.company}`}
      subtitle={`Gestão de contratos e ${context.labels.beneficiaries.toLowerCase()} — ${context.tenantName ?? context.nicheName}.`}
      demoEmail="rh@techcorp.com"
      demoPassword="bibi123"
      branding={context.branding}
      segmentContext={context}
    />
  );
}
