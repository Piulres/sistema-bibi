import LoginForm from "@/components/LoginForm";
import { getPlatformBranding } from "@/lib/theme/branding";

export default async function PjLoginPage() {
  const branding = await getPlatformBranding();

  return (
    <LoginForm
      portal="pj"
      title="Portal da Empresa (PJ)"
      subtitle="Gestão de contratos e beneficiários corporativos."
      demoEmail="rh@techcorp.com"
      demoPassword="bibi123"
      branding={branding}
    />
  );
}
