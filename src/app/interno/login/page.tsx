import LoginForm from "@/components/LoginForm";
import { getLoginBrandingFromHeaders } from "@/lib/theme/branding";

export default async function InternoLoginPage() {
  const branding = await getLoginBrandingFromHeaders();

  return (
    <LoginForm
      portal="interno"
      title="Portal Interno"
      subtitle="Entre com as credenciais da sua clínica para administrar operação e faturamento."
      demoEmail="faturamento@bibi.health"
      demoPassword="bibi123"
      branding={branding}
    />
  );
}
