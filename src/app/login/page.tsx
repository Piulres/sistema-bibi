import LoginForm from "@/components/LoginForm";
import { getLoginBrandingFromHeaders } from "@/lib/theme/branding";

export default async function PrestadorLoginPage() {
  const branding = await getLoginBrandingFromHeaders();

  return (
    <LoginForm
      portal="prestador"
      title="Portal do Prestador"
      subtitle="Entre com as credenciais da sua clínica para acessar agenda e prontuário."
      demoEmail="dra.helena@bibi.health"
      demoPassword="bibi123"
      branding={branding}
    />
  );
}
