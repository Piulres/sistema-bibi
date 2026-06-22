import LoginForm from "@/components/LoginForm";
import { getLoginBrandingFromHeaders } from "@/lib/theme/branding";

export default async function BeneficiarioLoginPage() {
  const branding = await getLoginBrandingFromHeaders();

  return (
    <LoginForm
      portal="beneficiario"
      title="Portal do Beneficiário"
      subtitle="Entre com as credenciais da sua clínica para agenda, consumo e faturas."
      demoEmail="joao.pereira@email.com"
      demoPassword="bibi123"
      branding={branding}
    />
  );
}
