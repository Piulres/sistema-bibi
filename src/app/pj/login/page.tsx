import LoginForm from "@/components/LoginForm";
import { getLoginBrandingFromHeaders } from "@/lib/theme/branding";

export default async function PjLoginPage() {
  const branding = await getLoginBrandingFromHeaders();

  return (
    <LoginForm
      portal="pj"
      title="Portal da Empresa (PJ)"
      subtitle="Entre com as credenciais da sua operação para gestão de contratos e beneficiários."
      demoEmail="rh@techcorp.com"
      demoPassword="bibi123"
      branding={branding}
    />
  );
}
