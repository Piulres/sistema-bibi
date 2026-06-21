import LoginForm from "@/components/LoginForm";
import { getPlatformBranding } from "@/lib/theme/branding";

export default async function BeneficiarioLoginPage() {
  const branding = await getPlatformBranding();

  return (
    <LoginForm
      portal="beneficiario"
      title="Portal do Beneficiário"
      subtitle="Acompanhe agenda, consumo Pay Per Use, faturas e assinatura."
      demoEmail="joao.pereira@email.com"
      demoPassword="bibi123"
      branding={branding}
    />
  );
}
