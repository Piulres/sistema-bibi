import LoginForm from "@/components/LoginForm";
import { getLoginSegmentContext } from "@/lib/segment/login-context";
import { persistSegmentCookie } from "@/lib/segment/cookie";

type PageProps = {
  searchParams: Promise<{ tenant?: string; niche?: string }>;
};

export default async function BeneficiarioLoginPage({ searchParams }: PageProps) {
  const { tenant: tenantParam, niche: nicheParam } = await searchParams;
  const context = await getLoginSegmentContext({ tenantSlug: tenantParam, nicheParam });
  await persistSegmentCookie(context);

  return (
    <LoginForm
      portal="beneficiario"
      title={`Portal do ${context.labels.beneficiary}`}
      subtitle={`Agenda, consumo e faturas para ${context.labels.beneficiaries.toLowerCase()} da operação ${context.tenantName ?? context.nicheName}.`}
      demoEmail="joao.pereira@email.com"
      demoPassword="bibi123"
      branding={context.branding}
      segmentContext={context}
    />
  );
}
